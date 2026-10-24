// Infobip SMS / WhatsApp adapter — placeholder.
// To activate: INFOBIP_API_KEY, INFOBIP_BASE_URL, INFOBIP_FROM.
// Per MOCK_TO_PRODUCTION_MIGRATION_PLAN.md §3.

import type { NotificationProvider, NotificationPayload, SendResult } from "../types";

export const infobipNotifications: NotificationProvider = {
  name: "infobip",
  channels: ["SMS", "WHATSAPP"] as const,

  async send(_: NotificationPayload): Promise<SendResult> {
    return {
      ok: false,
      error: "Infobip adapter not yet implemented. Set SMS_PROVIDER=mock or wire INFOBIP_API_KEY.",
    };
  },
};
