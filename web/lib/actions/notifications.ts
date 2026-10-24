"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/appointments";

// Notifications are scoped by userId (no role column), so these actions are
// role-agnostic. `path` lets each role's notifications page revalidate itself;
// it falls back to the patient route to preserve prior behaviour.
const markReadSchema = z.object({ id: z.string().min(1), path: z.string().optional() });
const markAllReadSchema = z.object({ path: z.string().optional() });

function revalidateNotif(path?: string) {
  revalidatePath(path?.startsWith("/") ? path : "/patient/notifications");
}

export async function markNotificationReadAction(input: { id: string; path?: string }): Promise<ActionResult> {
  const parsed = markReadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in." };

  const n = await prisma.notification.findUnique({ where: { id: parsed.data.id } });
  if (!n || n.userId !== session.user.id) return { ok: false, error: "Not allowed." };

  await prisma.notification.update({
    where: { id: n.id },
    data: { readAt: n.readAt ?? new Date() },
  });
  revalidateNotif(parsed.data.path);
  return { ok: true };
}

export async function markAllNotificationsReadAction(input?: { path?: string }): Promise<ActionResult> {
  const parsed = markAllReadSchema.safeParse(input ?? {});
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in." };
  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidateNotif(parsed.data.path);
  return { ok: true };
}
