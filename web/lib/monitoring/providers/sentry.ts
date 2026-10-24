// Sentry monitoring adapter — placeholder.
// To activate: pnpm dlx @sentry/wizard@latest -i nextjs (creates instrumentation.ts)
// + SENTRY_DSN env. Per MOCK_TO_PRODUCTION_MIGRATION_PLAN.md §10.

import type { MonitoringProvider, LogEvent } from "../types";
import { consoleMonitoring } from "./console";

export const sentryMonitoring: MonitoringProvider = {
  name: "sentry",

  log(event: LogEvent) {
    // Until Sentry SDK is wired, fall through to console so we don't lose visibility.
    consoleMonitoring.log(event);
  },

  captureException(error: unknown, context?: Record<string, unknown>) {
    consoleMonitoring.captureException(error, context);
  },
};
