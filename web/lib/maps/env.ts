// Zod-validated runtime config for the maps provider.

import { z } from "zod";

const schema = z.object({
  // Public token — bundled in client JS for mapbox-gl tile loads.
  // It's "public" because Mapbox lets you URL-restrict it in the dashboard.
  // We accept it on the server as a fallback for the secret token.
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string().min(20).optional(),
  // Optional secret token — server-only Directions/Geocoding calls.
  MAPBOX_SECRET_TOKEN: z.string().min(20).optional(),
  MAPBOX_STYLE_URL: z.string().default("mapbox://styles/mapbox/streets-v12"),
});

let cached: z.infer<typeof schema> | null = null;

export function getMapsEnv() {
  if (cached) return cached;
  cached = schema.parse({
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
    MAPBOX_SECRET_TOKEN: process.env.MAPBOX_SECRET_TOKEN,
    MAPBOX_STYLE_URL: process.env.MAPBOX_STYLE_URL,
  });
  return cached;
}

/**
 * Server-side token preference: secret > public.
 * Throws a clear error if neither is set when AI_PROVIDER=mapbox is selected.
 */
export function getServerMapboxToken(): string {
  const env = getMapsEnv();
  const token = env.MAPBOX_SECRET_TOKEN ?? env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "Mapbox token missing. Set MAPBOX_SECRET_TOKEN (preferred) or NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.",
    );
  }
  return token;
}

/**
 * Client-side token. Returns undefined (rather than throwing) so UI can
 * show a friendly "map unavailable" state in dev environments without a token.
 */
export function getPublicMapboxToken(): string | undefined {
  return process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
}
