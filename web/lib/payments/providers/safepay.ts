// Safepay payment adapter — placeholder. Recommended provider for Pakistan
// per PRODUCTION_SERVICES_AND_API_REQUIREMENTS.md §7.
//
// To activate:
//   1. Set SAFEPAY_API_KEY, SAFEPAY_WEBHOOK_SECRET, SAFEPAY_ENV (sandbox|production) in env
//   2. Replace the throwing stubs with real Safepay API calls
//      (https://docs.safepay.pk/)

import type { PaymentProvider, PaymentIntent, CreateIntentInput, WebhookVerification } from "../types";

function notConfigured(): never {
  throw new Error(
    "Safepay payment adapter is not yet implemented. Set PAYMENT_PROVIDER=mock for development, " +
    "or implement per MOCK_TO_PRODUCTION_MIGRATION_PLAN.md §4 with SAFEPAY_API_KEY and SAFEPAY_WEBHOOK_SECRET.",
  );
}

export const safepayPayments: PaymentProvider = {
  name: "safepay",
  async createIntent(_: CreateIntentInput): Promise<PaymentIntent> { notConfigured(); },
  async capture(_: string): Promise<PaymentIntent> { notConfigured(); },
  async refund(_: string, __?: number): Promise<PaymentIntent> { notConfigured(); },
  verifyWebhook(_: string, __: string): WebhookVerification {
    return { ok: false, reason: "Safepay adapter not implemented yet" };
  },
};
