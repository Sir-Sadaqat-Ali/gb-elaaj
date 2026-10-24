// Monitoring abstraction — error tracking + structured logging in one provider.
// Currently most code uses console.error; the monitoring provider becomes the
// single point where Sentry / Axiom / Logtail integration lives.

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export type LogEvent = {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: unknown;
  userId?: string;
  requestId?: string;
};

export interface MonitoringProvider {
  readonly name: string;
  log(event: LogEvent): void;
  captureException(error: unknown, context?: Record<string, unknown>): void;
}
