import type { MonitoringProvider } from "./types";
import { consoleMonitoring } from "./providers/console";
import { sentryMonitoring } from "./providers/sentry";

export type { MonitoringProvider, LogEvent, LogLevel } from "./types";

export function getMonitoringProvider(): MonitoringProvider {
  switch (process.env.MONITORING_PROVIDER) {
    case "sentry": return sentryMonitoring;
    default:       return consoleMonitoring;
  }
}

// Convenience helpers — most call sites don't need the provider object
export function log(event: import("./types").LogEvent) {
  return getMonitoringProvider().log(event);
}
export function captureException(error: unknown, context?: Record<string, unknown>) {
  return getMonitoringProvider().captureException(error, context);
}
