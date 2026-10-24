// Slim helper for fire-and-forget email dispatch from server actions.
// Existing in-app Notification rows are still written inside the tx by the
// caller — this only handles the EMAIL channel, called AFTER tx commits.
// Errors are logged, never thrown — a transient Resend failure must NOT
// crash the action.

import { prisma } from "@/lib/db";
import { getEmailProvider } from "./index";
import type { NotificationTemplate } from "./types";

export async function sendEmailFor(opts: {
  userId: string;
  template: NotificationTemplate;
  data: Record<string, string | number>;
}): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: opts.userId },
      select: { email: true },
    });
    if (!user?.email) return; // silently skip if no email on record

    const provider = getEmailProvider();
    const result = await provider.send({
      to: { userId: opts.userId, email: user.email },
      channel: "EMAIL",
      template: opts.template,
      data: opts.data,
    });

    if (!result.ok) {
      console.error(`[email] dispatch failed for ${opts.template}:`, result.error);
    }
  } catch (e) {
    console.error(`[email] unexpected error for ${opts.template}:`, e);
  }
}
