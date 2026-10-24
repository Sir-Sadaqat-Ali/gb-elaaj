import type { NotificationProvider, NotificationPayload, SendResult } from "../types";

export const mockNotifications: NotificationProvider = {
  name: "mock",
  channels: ["EMAIL", "SMS", "WHATSAPP", "IN_APP"] as const,

  async send(payload: NotificationPayload): Promise<SendResult> {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[mock notif] ${payload.channel} to ${payload.to.userId}: ${payload.template}`, payload.data);
    }
    return { ok: true, providerRef: `mock_${Date.now()}` };
  },
};
