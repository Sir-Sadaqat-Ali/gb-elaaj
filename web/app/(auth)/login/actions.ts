"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ROLE_HOME } from "@/lib/auth.config";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  next: z.string().optional(),
});

export type LoginActionResult = { ok: true } | { ok: false; error: string };

export async function loginAction(input: z.infer<typeof schema>): Promise<LoginActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const { email, password, next } = parsed.data;

  // 1. Try to sign in (writes the session cookie on success).
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      // CredentialsSignin == bad email/password; everything else is generic.
      return { ok: false, error: "Invalid email or password." };
    }
    // Don't swallow NEXT_REDIRECT or other system errors.
    throw error;
  }

  // 2. Resolve role and redirect to that role's home (or `next` if provided).
  // Prefer the freshly-mounted session; fall back to a DB lookup.
  let role: string | undefined;
  try {
    const session = await auth();
    role = session?.user?.role as string | undefined;
  } catch {
    // ignore
  }
  if (!role) {
    const u = await prisma.user.findUnique({ where: { email }, select: { role: true } });
    role = u?.role;
  }
  if (!role) {
    return { ok: false, error: "Account not found." };
  }

  const dest = next && next.startsWith("/") ? next : ROLE_HOME[role as keyof typeof ROLE_HOME];
  redirect(dest);
}
