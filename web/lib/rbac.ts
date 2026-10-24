// ─────────────────────────────────────────────────────────────
// Role-based access control — server-side helpers.
// Single source of truth for role homes lives in lib/auth.config.ts.
// Use requireRole() at the top of every protected layout/page/action.
// ─────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/auth.config";
import type { Role } from "@prisma/client";

export { ROLE_HOME, ROLE_LABEL };

export async function getSession() {
  return auth();
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRole(allowed: Role | Role[]) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const allowedList = Array.isArray(allowed) ? allowed : [allowed];
  if (!allowedList.includes(session.user.role)) {
    redirect(ROLE_HOME[session.user.role]);
  }
  return session;
}
