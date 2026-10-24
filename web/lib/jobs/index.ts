import type { JobsProvider } from "./types";
import { mockJobs } from "./providers/mock";
import { vercelCron } from "./providers/vercel-cron";

export type { JobsProvider, JobContext, JobResult } from "./types";

export function getJobsProvider(): JobsProvider {
  switch (process.env.JOB_PROVIDER) {
    case "vercel-cron": return vercelCron;
    case "mock":
    default:            return mockJobs;
  }
}
