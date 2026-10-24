import type { PaymentProvider } from "./types";
import { mockPayments } from "./providers/mock";
import { safepayPayments } from "./providers/safepay";

export type { PaymentProvider, PaymentIntent, PaymentStatus, PaymentEvent, WebhookVerification } from "./types";

export function getPaymentProvider(): PaymentProvider {
  switch (process.env.PAYMENT_PROVIDER) {
    case "safepay": return safepayPayments;
    case "mock":
    default:        return mockPayments;
  }
}
