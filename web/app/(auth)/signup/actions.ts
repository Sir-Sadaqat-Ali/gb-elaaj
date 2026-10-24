"use server";

import { redirect } from "next/navigation";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { signupSchema, type SignupInput } from "@/lib/validation/auth";
import { ROLE_HOME } from "@/lib/auth.config";
import { dispatchNotification } from "@/lib/notifications/dispatch";

export type SignupActionResult = { ok: true } | { ok: false; error: string };

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

export async function signupAction(input: SignupInput): Promise<SignupActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (existing) {
    return { ok: false, error: "An account with this email or phone already exists." };
  }

  // Bcrypt cost 12 — bumped from 10 per SECURITY_AUDIT.md.
  const passwordHash = await bcrypt.hash(password, 12);

  // Email verification token to send right after signup
  const verifyPlain = randomBytes(32).toString("base64url");
  const verifyHash = createHash("sha256").update(verifyPlain).digest("hex");

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: Role.PATIENT,
      emailVerifyTokenHash: verifyHash,
      emailVerifyExpires: new Date(Date.now() + VERIFY_TTL_MS),
      patient: { create: {} },
    },
  });

  // Send verification email (non-blocking — don't fail signup if Resend hiccups)
  dispatchNotification({
    userId: user.id,
    template: "auth.email-verify",
    data: { token: verifyPlain, name },
    email: true,
  }).catch((e) => console.error("[signup] verification email dispatch failed:", e));

  // Sign in immediately so they land on their dashboard.
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    redirect("/login");
  }
  redirect(ROLE_HOME.PATIENT);
}
