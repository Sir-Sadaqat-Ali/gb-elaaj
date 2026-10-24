// Notification composer — single entry point for every server action that
// wants to inform a user of something.
//
// Always writes an in-app row (the Notification table) so the bell counter
// + /patient/notifications page work. Then dispatches via email if requested.
//
// Server actions should import dispatchNotification rather than calling
// prisma.notification.create directly.

import { prisma } from "@/lib/db";
import { getEmailProvider } from "./index";
import { renderTemplate } from "./templates";
import type { NotificationTemplate } from "./types";

type DispatchOpts = {
  /** User to notify (must already exist; we don't create users here). */
  userId: string;
  /** Template key — drives subject, copy, CTAs. */
  template: NotificationTemplate;
  /** Template data (interpolated into subject + body). */
  data: Record<string, string | number>;
  /** Where the in-app notification deep-links to. Optional. */
  href?: string;
  /** Send email in addition to in-app? Default: true for auth/financial templates, false otherwise. */
  email?: boolean;
};

const ALWAYS_EMAIL: ReadonlySet<NotificationTemplate> = new Set([
  "auth.email-verify",
  "auth.password-reset",
  "auth.phone-otp", // SMS, but email fallback if no phone
  "withdrawal.status",
  "doctor.verification.status",
]);

export async function dispatchNotification(opts: DispatchOpts) {
  const rendered = renderTemplate(opts.template, opts.data);

  // 1. Always write the in-app notification row
  await prisma.notification.create({
    data: {
      userId: opts.userId,
      title: rendered.subject,
      body: rendered.text.split("\n")[0] ?? rendered.subject,
      href: opts.href ?? null,
      channel: "IN_APP",
    },
  }).catch((e) => {
    console.error("[notifications] in-app write failed:", e);
  });

  // 2. Email if asked or if template demands it
  const shouldEmail = opts.email ?? ALWAYS_EMAIL.has(opts.template);
  if (!shouldEmail) return;

  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { email: true },
  });
  if (!user?.email) {
    console.warn(`[notifications] cannot email user ${opts.userId} — no email on record`);
    return;
  }

  const provider = getEmailProvider();
  const result = await provider.send({
    to: { userId: opts.userId, email: user.email },
    channel: "EMAIL",
    template: opts.template,
    data: opts.data,
  });

  if (!result.ok) {
    console.error(`[notifications] email dispatch failed for ${opts.template}:`, result.error);
  }
}
