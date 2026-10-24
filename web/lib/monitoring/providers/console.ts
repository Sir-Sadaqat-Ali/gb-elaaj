// Default monitoring provider — wraps console.* with the typed interface.
// In production, replace with Sentry per MOCK_TO_PRODUCTION_MIGRATION_PLAN.md §10.

import type { MonitoringProvider, LogEvent } from "../types";

export const consoleMonitoring: MonitoringProvider = {
  name: "console",

  log({ level, message, context, error, userId, requestId }: LogEvent) {
    const prefix = `[${level}]${requestId ? ` ${requestId}` : ""}${userId ? ` u=${userId}` : ""}`;
    const fn = level === "error" || level === "fatal" ? console.error : level === "warn" ? console.warn : console.log;
    if (error) {
      fn(prefix, message, { ...context, error });
    } else {
      fn(prefix, message, context ?? {});
    }
  },

  captureException(error: unknown, context?: Record<string, unknown>) {
    console.error("[exception]", error, context ?? {});
  },
};
