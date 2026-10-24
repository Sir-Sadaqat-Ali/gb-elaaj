export type NotificationChannel = "EMAIL" | "SMS" | "WHATSAPP" | "IN_APP";

export type NotificationTemplate =
  | "appointment.confirmed"
  | "appointment.reminder"
  | "appointment.cancelled"
  | "lab.report.ready"
  | "pharmacy.order.update"
  | "home-care.assignment"
  | "withdrawal.status"
  | "doctor.verification.status"
  | "auth.email-verify"
  | "auth.password-reset"
  | "auth.phone-otp"
  | "support.ticket";

export type NotificationPayload = {
  to: { userId: string; email?: string; phone?: string };
  channel: NotificationChannel;
  template: NotificationTemplate;
  data: Record<string, string | number>;
};

export type SendResult = { ok: true; providerRef?: string } | { ok: false; error: string };

export interface NotificationProvider {
  readonly name: string;
  readonly channels: readonly NotificationChannel[];
  send(input: NotificationPayload): Promise<SendResult>;
}
