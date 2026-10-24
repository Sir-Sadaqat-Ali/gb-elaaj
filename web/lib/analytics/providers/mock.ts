import type { AnalyticsProvider, AnalyticsEvent } from "../types";

export const mockAnalytics: AnalyticsProvider = {
  name: "mock",
  async capture(event: AnalyticsEvent) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[analytics] ${event.name}`, event.properties ?? {});
    }
  },
  async identify(userId, traits) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[analytics] identify ${userId}`, traits);
    }
  },
};
