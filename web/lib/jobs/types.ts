// Background jobs abstraction — for Vercel Cron (v1) and event-driven runners
// like Inngest (v2). Initially this is just a marker for cron route handlers
// to share auth + idempotency helpers.

export type JobContext = {
  jobName: string;
  startedAt: Date;
  triggeredBy: "cron" | "manual" | "event";
};

export type JobResult = {
  ok: boolean;
  itemsProcessed: number;
  errors?: string[];
  durationMs: number;
};

export interface JobsProvider {
  readonly name: string;
  /**
   * Validate a cron request (e.g. checks `Authorization: Bearer ${CRON_SECRET}` header).
   * Returns true if the request is from the expected scheduler.
   */
  authorizeCron(headers: Headers): boolean;
}
