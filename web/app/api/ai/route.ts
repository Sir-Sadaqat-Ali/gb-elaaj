// POST /api/ai — Aafiyat patient assistant.
//
// Safety chain (each step gates the next):
//   1. Auth                                        → 401
//   2. JSON shape (Zod)                            → 400
//   3. Per-user rate limit (60/min)                → 429
//   4. Emergency keyword detection on raw input    → return EMERGENCY_REPLY (skip LLM)
//   5. PII redaction on user content
//   6. Provider chat (OpenRouter when AI_PROVIDER=openrouter, mock otherwise)
//   7. Output sanitization (block prescription, soften diagnosis, force disclaimer)
//   8. Audit log (metadata only, never message content)
//
// All replies set Cache-Control: no-store.

import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  AI_DISCLAIMER_TEXT,
  EMERGENCY_REPLY,
  SYSTEM_PROMPT,
  detectEmergency,
  getAiProvider,
  redactPII,
  sanitizeOutput,
  type AiMessage,
} from "@/lib/ai";
import { checkRateLimit } from "@/lib/ai/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const inputSchema = z.object({
  // Either { message } (legacy single-shot) OR { messages } (full thread, future).
  message: z.string().min(1).max(4000).optional(),
  messages: z.array(messageSchema).min(1).max(40).optional(),
}).refine((d) => d.message || (d.messages && d.messages.length > 0), {
  message: "Provide `message` or non-empty `messages` array.",
});

function jsonError(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { ok: false, error: { code, message }, ...(extra ?? {}) },
    { status, headers: NO_STORE },
  );
}

async function logAudit(actorUserId: string, action: string, meta: Record<string, unknown>) {
  await prisma.auditLog
    .create({
      data: {
        actorUserId,
        action,
        targetType: "AiMessage",
        meta: meta as Prisma.InputJsonValue,
      },
    })
    .catch(() => {});
}

export async function POST(req: Request) {
  // 1. Auth
  const session = await auth();
  if (!session?.user) {
    return jsonError(401, "UNAUTHORIZED", "Please sign in.");
  }
  const userId = session.user.id;

  // 2. JSON + shape
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "BAD_JSON", "Invalid JSON.");
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  // Normalize to messages array
  const messages: AiMessage[] = parsed.data.messages
    ? parsed.data.messages
    : [{ role: "user", content: parsed.data.message! }];

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return jsonError(400, "VALIDATION", "Need at least one user message.");
  }

  // 3. Rate limit
  const rl = checkRateLimit({ key: `ai:${userId}`, max: 60, windowMs: 60_000 });
  const rlHeaders = {
    "x-ratelimit-limit": String(rl.limit),
    "x-ratelimit-remaining": String(rl.remaining),
    "x-ratelimit-reset": String(Math.ceil(rl.resetAt / 1000)),
  };
  if (!rl.allowed) {
    await logAudit(userId, "ai.message.refused", { reason: "rate_limit" });
    return NextResponse.json(
      { ok: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please slow down." } },
      { status: 429, headers: { ...NO_STORE, ...rlHeaders } },
    );
  }

  // 4. Emergency detection — check the LATEST user message before LLM call
  if (detectEmergency(lastUser.content)) {
    await logAudit(userId, "ai.message.refused", {
      reason: "emergency",
      chars: lastUser.content.length,
    });
    return NextResponse.json(
      { ok: true, data: { reply: `${EMERGENCY_REPLY}\n\n${AI_DISCLAIMER_TEXT}`, emergency: true } },
      { status: 200, headers: { ...NO_STORE, ...rlHeaders } },
    );
  }

  // 5. PII redaction on every user message before LLM
  const redactedMessages: AiMessage[] = messages.map((m) =>
    m.role === "user" ? { role: "user", content: redactPII(m.content) } : m,
  );

  // 6. Provider call
  const provider = getAiProvider();
  const startedAt = Date.now();
  let providerResult;
  try {
    if (provider.chatWithUsage) {
      providerResult = await provider.chatWithUsage({
        messages: redactedMessages,
        system: SYSTEM_PROMPT,
        userId,
      });
    } else {
      const reply = await provider.chat({
        messages: redactedMessages,
        system: SYSTEM_PROMPT,
        userId,
      });
      providerResult = {
        reply,
        usage: { inputTokens: 0, outputTokens: 0, model: provider.name },
      };
    }
  } catch (err) {
    const errType = err instanceof Error ? err.name : "Unknown";
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[ai] provider error:", errMsg);
    await logAudit(userId, "ai.message.error", {
      provider: provider.name,
      errorType: errType,
    });
    return NextResponse.json(
      {
        ok: true,
        data: {
          reply:
            "I'm having trouble responding right now. Please try again in a moment, or [book a consultation with a verified doctor](/doctors) if you need help.\n\n" +
            AI_DISCLAIMER_TEXT,
          emergency: false,
        },
      },
      { status: 200, headers: { ...NO_STORE, ...rlHeaders } },
    );
  }
  const durationMs = Date.now() - startedAt;

  // 7. Output sanitization — disclaimer + diagnosis softening + Rx blocking
  const { text: finalText, outcome } = sanitizeOutput(providerResult.reply.content);

  // 8. Audit (metadata only — never persist message content)
  await logAudit(userId, "ai.message.completed", {
    provider: provider.name,
    model: providerResult.usage.model,
    inputTokens: providerResult.usage.inputTokens,
    outputTokens: providerResult.usage.outputTokens,
    durationMs,
    sanitize: outcome,
    inputChars: lastUser.content.length,
  });

  return NextResponse.json(
    { ok: true, data: { reply: finalText, emergency: false } },
    { status: 200, headers: { ...NO_STORE, ...rlHeaders } },
  );
}
