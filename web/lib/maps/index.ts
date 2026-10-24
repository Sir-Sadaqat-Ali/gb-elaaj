// Maps provider switch.
//   • mock   — dev default; Pakistan city lookup + Haversine
//   • mapbox — real Mapbox APIs (Geocoding + Directions)

import type { MapsProvider } from "./types";
import { mockMaps } from "./providers/mock";
import { mapboxMaps } from "./providers/mapbox";

export type {
  MapsProvider,
  Coordinates,
  DistanceResult,
  GeocodeResult,
  RouteGeometry,
} from "./types";

export { getPublicMapboxToken } from "./env";

export function getMapsProvider(): MapsProvider {
  switch (process.env.MAPS_PROVIDER) {
    case "mapbox":
      return mapboxMaps;
    case "mock":
    default:
      return mockMaps;
  }
}
