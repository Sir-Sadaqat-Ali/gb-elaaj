"use server";

import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { dispatchNotification } from "@/lib/notifications/dispatch";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

function generateToken(): { plain: string; hash: string } {
  const plain = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(plain).digest("hex");
  return { plain, hash };
}

function hashToken(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

/**
 * Send (or resend) an email-verification link to the signed-in user.
 * No-op if the user has no email or is already verified.
 */
export async function sendVerificationEmailAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Please sign in." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, emailVerified: true },
  });
  if (!user || !user.email) {
    return { ok: false, error: "No email on file. Add one in Settings first." };
  }
  if (user.emailVerified) {
    return { ok: true, message: "Your email is already verified." };
  }

  const { plain, hash } = generateToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifyTokenHash: hash,
      emailVerifyExpires: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  await dispatchNotification({
    userId: user.id,
    template: "auth.email-verify",
    data: { token: plain, name: user.name },
    email: true,
  });

  return { ok: true, message: "Verification email sent. Check your inbox." };
}

/**
 * Server-side verifier — called by /verify-email/[token]/page.tsx.
 * Returns user-facing strings; the page renders them.
 */
export async function verifyEmailToken(token: string): Promise<ActionResult> {
  if (!token || token.length < 20) {
    return { ok: false, error: "This verification link is invalid." };
  }
  const tokenHash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: {
      emailVerifyTokenHash: tokenHash,
      emailVerifyExpires: { gt: new Date() },
    },
    select: { id: true, status: true },
  });
  if (!user) {
    return { ok: false, error: "This link is invalid or has expired. Sign in and resend." };
  }
  if (user.status === "SUSPENDED") {
    return { ok: false, error: "This account is suspended. Contact support." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerifyTokenHash: null,
      emailVerifyExpires: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "auth.email.verified",
      targetType: "User",
      targetId: user.id,
    },
  });

  return { ok: true, message: "Your email is verified. You can close this tab." };
}
