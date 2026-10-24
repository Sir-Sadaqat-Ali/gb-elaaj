import type { AnalyticsProvider } from "./types";
import { mockAnalytics } from "./providers/mock";
import { posthogAnalytics } from "./providers/posthog";

export type { AnalyticsProvider, AnalyticsEvent } from "./types";

export function getAnalyticsProvider(): AnalyticsProvider {
  switch (process.env.ANALYTICS_PROVIDER) {
    case "posthog": return posthogAnalytics;
    case "mock":
    default:        return mockAnalytics;
  }
}
