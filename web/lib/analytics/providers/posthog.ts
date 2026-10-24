// PostHog analytics adapter — placeholder.
// To activate: NEXT_PUBLIC_POSTHOG_KEY + NEXT_PUBLIC_POSTHOG_HOST + pnpm add posthog-node.

import type { AnalyticsProvider, AnalyticsEvent } from "../types";

export const posthogAnalytics: AnalyticsProvider = {
  name: "posthog",
  async capture(_: AnalyticsEvent) {
    // No-op until wired. Throwing here would block app code that emits events.
  },
  async identify(_, __) {
    // No-op until wired.
  },
};
