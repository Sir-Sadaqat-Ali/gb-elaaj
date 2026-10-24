// Realtime provider types.
//
// Phase 1 ships with a polling provider — clients fetch /api/location/latest
// every few seconds. This abstraction is in place so we can swap to push
// transport (Pusher / Supabase Realtime / Ably) by changing one env var
// without touching UI components.

export type RealtimeEvent = {
  channel: string;
  event: string;
  payload: unknown;
};

export interface RealtimeProvider {
  readonly name: string;

  /**
   * Server-side broadcast. Polling provider is a no-op (clients pull instead).
   */
  publish(event: RealtimeEvent): Promise<void>;

  /**
   * Suggested polling interval in ms — UI uses this to decide refresh rate.
   * Push providers can return Infinity to indicate "no polling needed".
   */
  getRefreshIntervalMs(): number;
}
