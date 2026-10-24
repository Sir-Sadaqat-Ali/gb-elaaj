import type { NotificationProvider, NotificationChannel } from "./types";
import { mockNotifications } from "./providers/mock";
import { resendNotifications } from "./providers/resend";
import { infobipNotifications } from "./providers/infobip";

export type { NotificationProvider, NotificationChannel, NotificationPayload, NotificationTemplate, SendResult } from "./types";

export function getEmailProvider(): NotificationProvider {
  switch (process.env.EMAIL_PROVIDER) {
    case "resend": return resendNotifications;
    case "mock":
    default:       return mockNotifications;
  }
}

export function getSmsProvider(): NotificationProvider {
  switch (process.env.SMS_PROVIDER) {
    case "infobip": return infobipNotifications;
    case "mock":
    default:        return mockNotifications;
  }
}

export function getProviderForChannel(channel: NotificationChannel): NotificationProvider {
  switch (channel) {
    case "EMAIL": return getEmailProvider();
    case "SMS":
    case "WHATSAPP": return getSmsProvider();
    case "IN_APP":
    default: return mockNotifications;  // IN_APP is just a DB write, no external send
  }
}
