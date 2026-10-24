import type { JobsProvider } from "../types";

export const mockJobs: JobsProvider = {
  name: "mock",
  authorizeCron(_: Headers): boolean {
    // Dev: allow any caller. NEVER do this in production.
    return process.env.NODE_ENV !== "production";
  },
};
