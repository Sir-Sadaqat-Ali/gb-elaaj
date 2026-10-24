// Payment provider contract — same shape for Safepay, Stripe, JazzCash, mock.

export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";

export type PaymentIntent = {
  id: string;
  status: PaymentStatus;
  amountPaisa: number;
  currency: "PKR" | "USD";
  redirectUrl?: string;
  clientSecret?: string;
};

export type CreateIntentInput = {
  amountPaisa: number;
  currency: "PKR" | "USD";
  payerUserId: string;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
};

export type PaymentEvent =
  | { kind: "payment.succeeded"; intentId: string; amountPaisa: number; metadata: Record<string, string> }
  | { kind: "payment.failed"; intentId: string; reason: string }
  | { kind: "payment.refunded"; intentId: string; amountPaisa: number };

export type WebhookVerification =
  | { ok: true; event: PaymentEvent }
  | { ok: false; reason: string };

export interface PaymentProvider {
  readonly name: string;
  createIntent(input: CreateIntentInput): Promise<PaymentIntent>;
  capture(intentId: string): Promise<PaymentIntent>;
  refund(intentId: string, amountPaisa?: number): Promise<PaymentIntent>;
  verifyWebhook(rawBody: string, signature: string): WebhookVerification;
}
