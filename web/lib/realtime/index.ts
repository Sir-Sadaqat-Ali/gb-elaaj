// Realtime provider switch.
//   • polling   — default; clients fetch every getRefreshIntervalMs()
//   • supabase  — broadcast via Supabase Realtime channels (optional)
//
// To add a new provider: drop it under providers/, switch on REALTIME_PROVIDER
// here. UI components consume only `getRealtimeProvider().getRefreshIntervalMs()`
// so swapping providers is non-breaking.

import type { RealtimeProvider } from "./types";
import { pollingRealtime } from "./providers/polling";

export type { RealtimeProvider, RealtimeEvent } from "./types";

export function getRealtimeProvider(): RealtimeProvider {
  switch (process.env.REALTIME_PROVIDER) {
    // case "supabase": return supabaseRealtime;
    case "polling":
    default:
      return pollingRealtime;
  }
}
