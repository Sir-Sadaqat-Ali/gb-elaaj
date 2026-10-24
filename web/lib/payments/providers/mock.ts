// Mock payment adapter — instantly succeeds. Mirrors the current pre-Phase-7 behavior.

import type { PaymentProvider, PaymentIntent, CreateIntentInput, WebhookVerification } from "../types";

let counter = 0;

export const mockPayments: PaymentProvider = {
  name: "mock",

  async createIntent({ amountPaisa, currency, successUrl }: CreateIntentInput): Promise<PaymentIntent> {
    const id = `mock_pi_${Date.now()}_${++counter}`;
    return {
      id,
      status: "SUCCEEDED",
      amountPaisa,
      currency,
      redirectUrl: successUrl,
    };
  },

  async capture(intentId: string): Promise<PaymentIntent> {
    return { id: intentId, status: "SUCCEEDED", amountPaisa: 0, currency: "PKR" };
  },

  async refund(intentId: string, amountPaisa = 0): Promise<PaymentIntent> {
    return { id: intentId, status: "REFUNDED", amountPaisa, currency: "PKR" };
  },

  verifyWebhook(_raw: string, _sig: string): WebhookVerification {
    return { ok: false, reason: "mock provider does not accept webhooks" };
  },
};
