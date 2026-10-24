// POST /api/ai/lab-report-summary
//
// Generates a plain-language explanation of a structured lab report.
// Uses the LabReport.results JSON (not the raw PDF) — safer + cheaper.
//
// Auth + RBAC chain:
//   1. Signed in
//   2. Caller is the patient who owns this booking
//      OR a doctor who has had at least one appointment with that patient
//      OR an admin
//   3. LabReport must exist and have parsed results
//   4. Per-user rate limit (lower than chat: 20/min — explanations are heavier)
//
// Returns:
//   { summary: string, abnormal: boolean, doctor_consultation_recommended: boolean }
//
// Never persists the explanation text — only audit metadata.

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma, Role } from "@prisma/client";
import {
  AI_DISCLAIMER_TEXT,
  getAiProvider,
  sanitizeOutput,
} from "@/lib/ai";
import { checkRateLimit } from "@/lib/ai/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };

const inputSchema = z.object({
  reportId: z.string().min(1).max(40),
});

const LAB_SYSTEM_PROMPT = [
  "You are Aafiyat, the medical assistant for Gb Elaaj.",
  "You will receive a structured lab report (parameters, values, units, reference ranges, and flags).",
  "Your job is to explain what each parameter generally measures, in plain language a non-medical reader can follow.",
  "",
  "STRICT RULES:",
  "1. Do NOT diagnose. Never say 'you have X' or 'this means you have X'. Use phrases like 'this could indicate...' or 'a doctor would look at this together with your history'.",
  "2. Do NOT prescribe medication or supplements.",
  "3. If any flagged-abnormal value appears, mention it factually and recommend the patient discuss it with their doctor — do not interpret severity.",
  "4. Be brief. One short paragraph (3–5 sentences) max per parameter, fewer is better.",
  "5. End with: 'Please review these results with your doctor for proper interpretation.'",
  "6. Use simple, clear language. Translate medical terms when used.",
].join("\n");

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status, headers: NO_STORE },
  );
}

async function logAudit(actorUserId: string, action: string, targetId: string, meta: Record<string, unknown>) {
  await prisma.auditLog
    .create({
      data: {
        actorUserId,
        action,
        targetType: "LabReport",
        targetId,
        meta: meta as Prisma.InputJsonValue,
      },
    })
    .catch(() => {});
}

export async function POST(req: Request) {
  // Auth
  const session = await auth();
  if (!session?.user) return jsonError(401, "UNAUTHORIZED", "Please sign in.");
  const userId = session.user.id;
  const role = session.user.role;

  // Body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "BAD_JSON", "Invalid JSON.");
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "VALIDATION", "Missing reportId.");

  // Rate limit
  const rl = checkRateLimit({ key: `ai:lab:${userId}`, max: 20, windowMs: 60_000 });
  const rlHeaders = {
    "x-ratelimit-limit": String(rl.limit),
    "x-ratelimit-remaining": String(rl.remaining),
    "x-ratelimit-reset": String(Math.ceil(rl.resetAt / 1000)),
  };
  if (!rl.allowed) {
    await logAudit(userId, "ai.lab_summary.refused", parsed.data.reportId, { reason: "rate_limit" });
    return NextResponse.json(
      { ok: false, error: { code: "RATE_LIMITED", message: "Too many summary requests." } },
      { status: 429, headers: { ...NO_STORE, ...rlHeaders } },
    );
  }

  // Load report + ownership chain
  const report = await prisma.labReport.findUnique({
    where: { id: parsed.data.reportId },
    include: {
      booking: {
        include: {
          patient: { select: { userId: true } },
          test: { select: { nameEn: true, sampleType: true } },
        },
      },
    },
  });
  if (!report) return jsonError(404, "NOT_FOUND", "Report not found.");
  if (!report.results) {
    return jsonError(409, "NO_RESULTS", "This report doesn't have parsed results yet.");
  }

  const ownerUserId = report.booking.patient.userId;
  const isOwner = ownerUserId === userId;
  const isAdmin = role === Role.ADMIN;
  let isDoctor = false;
  if (!isOwner && !isAdmin && role === Role.DOCTOR) {
    // Doctor allowed if they've had ≥ 1 appointment with this patient
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { doctor: { select: { id: true } } },
    });
    if (me?.doctor) {
      const apptCount = await prisma.appointment.count({
        where: { doctorId: me.doctor.id, patientId: report.booking.patientId },
      });
      isDoctor = apptCount > 0;
    }
  }
  if (!isOwner && !isAdmin && !isDoctor) {
    return jsonError(403, "FORBIDDEN", "You don't have permission to view this report.");
  }

  // Provider call — feed structured results, NOT raw PDF/image text
  const provider = getAiProvider();
  const userPrompt = [
    `Lab test: ${report.booking.test.nameEn}`,
    `Sample type: ${report.booking.test.sampleType ?? "—"}`,
    `Abnormal flag (any out-of-range): ${report.abnormal ? "yes" : "no"}`,
    "",
    "Structured results:",
    "```json",
    JSON.stringify(report.results, null, 2),
    "```",
    "",
    "Please provide a plain-language explanation of these results.",
  ].join("\n");

  const startedAt = Date.now();
  let providerResult;
  try {
    if (provider.chatWithUsage) {
      providerResult = await provider.chatWithUsage({
        messages: [{ role: "user", content: userPrompt }],
        system: LAB_SYSTEM_PROMPT,
        userId,
        maxOutputTokens: 1200,
      });
    } else {
      const reply = await provider.chat({
        messages: [{ role: "user", content: userPrompt }],
        system: LAB_SYSTEM_PROMPT,
        userId,
      });
      providerResult = {
        reply,
        usage: { inputTokens: 0, outputTokens: 0, model: provider.name },
      };
    }
  } catch (err) {
    const errType = err instanceof Error ? err.name : "Unknown";
    console.error("[ai/lab-summary] provider error:", err);
    await logAudit(userId, "ai.lab_summary.error", parsed.data.reportId, {
      provider: provider.name,
      errorType: errType,
    });
    return NextResponse.json(
      {
        ok: true,
        data: {
          summary: `I couldn't generate a summary right now. Please try again, or discuss this report directly with your doctor.\n\n${AI_DISCLAIMER_TEXT}`,
          abnormal: report.abnormal,
          doctor_consultation_recommended: report.abnormal,
        },
      },
      { status: 200, headers: { ...NO_STORE, ...rlHeaders } },
    );
  }

  const { text: finalText, outcome } = sanitizeOutput(providerResult.reply.content);
  const durationMs = Date.now() - startedAt;

  await logAudit(userId, "ai.lab_summary.generated", parsed.data.reportId, {
    provider: provider.name,
    model: providerResult.usage.model,
    inputTokens: providerResult.usage.inputTokens,
    outputTokens: providerResult.usage.outputTokens,
    durationMs,
    sanitize: outcome,
    abnormal: report.abnormal,
    callerRole: isOwner ? "patient" : isDoctor ? "doctor" : "admin",
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        summary: finalText,
        abnormal: report.abnormal,
        doctor_consultation_recommended: report.abnormal,
      },
    },
    { status: 200, headers: { ...NO_STORE, ...rlHeaders } },
  );
}
