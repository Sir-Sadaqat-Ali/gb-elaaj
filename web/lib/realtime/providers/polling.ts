// Polling provider — server publishes are no-ops; clients pull on a timer.
// Default for first production version; zero extra infra.

import type { RealtimeProvider } from "../types";

export const pollingRealtime: RealtimeProvider = {
  name: "polling",

  async publish() {
    // No-op — clients use HTTP polling.
  },

  getRefreshIntervalMs() {
    return 4000;
  },
};
