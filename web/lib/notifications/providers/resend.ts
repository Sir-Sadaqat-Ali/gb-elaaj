// Resend email adapter — real production implementation.
//
// Activate by setting EMAIL_PROVIDER=resend in env, plus:
//   RESEND_API_KEY = re_...
//   EMAIL_FROM     = "Gb Elaaj <noreply@gbelaaj.com>"

import { Resend } from "resend";
import type { NotificationProvider, NotificationPayload, SendResult } from "../types";
import { renderTemplate } from "../templates";

let cachedClient: Resend | null = null;

function getClient(): Resend {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend.");
  }
  cachedClient = new Resend(apiKey);
  return cachedClient;
}

export const resendNotifications: NotificationProvider = {
  name: "resend",
  channels: ["EMAIL"] as const,

  async send(payload: NotificationPayload): Promise<SendResult> {
    if (!payload.to.email) {
      return { ok: false, error: "Email recipient missing." };
    }
    if (payload.channel !== "EMAIL") {
      return { ok: false, error: `Resend only handles EMAIL, got ${payload.channel}.` };
    }

    const from = process.env.EMAIL_FROM ?? "Gb Elaaj <noreply@gbelaaj.com>";
    const rendered = renderTemplate(payload.template, payload.data);

    try {
      const client = getClient();
      const result = await client.emails.send({
        from,
        to: [payload.to.email],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        // Tag with template name for analytics. Resend only allows
        // [A-Za-z0-9_-] in tag values, so replace dots with dashes.
        tags: [{ name: "template", value: payload.template.replace(/\./g, "-") }],
      });

      if (result.error) {
        return { ok: false, error: result.error.message ?? "Resend send failed." };
      }
      return { ok: true, providerRef: result.data?.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { ok: false, error: `Email send failed: ${message}` };
    }
  },
};
