"use server";

import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation/auth";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const BCRYPT_COST = 12;

function generateToken(): { plain: string; hash: string } {
  const plain = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(plain).digest("hex");
  return { plain, hash };
}

function hashToken(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

/**
 * Step 1: user submits their email. We always return success to avoid
 * leaking whether the email exists. We only actually send if it matches.
 */
export async function requestPasswordResetAction(
  input: { email: string },
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid email." };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, name: true, status: true },
  });

  // Constant-time-ish: don't reveal user existence
  if (user && user.status !== "SUSPENDED" && user.email) {
    const { plain, hash } = generateToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: hash,
        passwordResetExpires: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    await dispatchNotification({
      userId: user.id,
      template: "auth.password-reset",
      data: { token: plain, name: user.name },
      email: true,
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "auth.password-reset.requested",
        targetType: "User",
        targetId: user.id,
      },
    });
  }

  return {
    ok: true,
    message: "If that email is registered with us, you'll receive a reset link shortly.",
  };
}

/**
 * Step 2: user clicks the link, picks a new password.
 */
export async function resetPasswordAction(
  input: { token: string; password: string; confirmPassword: string },
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const tokenHash = hashToken(parsed.data.token);
  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { gt: new Date() },
    },
    select: { id: true, email: true, status: true },
  });

  if (!user) {
    return {
      ok: false,
      error: "This reset link is invalid or has expired. Request a new one.",
    };
  }
  if (user.status === "SUSPENDED") {
    return { ok: false, error: "This account is suspended. Contact support." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_COST);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpires: null,
      // Successful reset implies they own the email
      emailVerified: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "auth.password-reset.completed",
      targetType: "User",
      targetId: user.id,
    },
  });

  redirect("/login?reset=ok");
}
