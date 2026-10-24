// Mapbox provider — direct REST calls to api.mapbox.com.
//
// We deliberately don't use @mapbox/mapbox-sdk; raw fetch keeps the bundle
// minimal and the surface auditable. Endpoints used:
//
//   • Forward geocoding:  /geocoding/v5/mapbox.places/{q}.json
//   • Reverse geocoding:  /geocoding/v5/mapbox.places/{lng},{lat}.json
//   • Directions:         /directions/v5/mapbox/driving/{coords}?geometries=geojson
//
// All calls run server-side (this module is imported by API routes only).
// Client-side code uses mapbox-gl with the public token; never imports this.

import type {
  Coordinates,
  DistanceResult,
  GeocodeResult,
  MapsProvider,
  RouteGeometry,
} from "../types";
import { getServerMapboxToken } from "../env";

const BASE = "https://api.mapbox.com";

async function mapboxFetch<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const token = getServerMapboxToken();
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("access_token", token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      // 8s timeout via AbortSignal — matches user expectation of "instant"
      signal: AbortSignal.timeout(8_000),
      // Mapbox supports caching but we keep it simple — no extra headers
    });
  } catch (err) {
    console.error("[mapbox] network error:", err);
    return null;
  }
  if (!res.ok) {
    console.error(`[mapbox] HTTP ${res.status} on ${path}`);
    return null;
  }
  return (await res.json()) as T;
}

type MapboxFeature = {
  center: [number, number]; // [lng, lat]
  place_name: string;
};
type MapboxGeocoderResponse = {
  features: MapboxFeature[];
};

type MapboxRoute = {
  distance: number; // meters
  duration: number; // seconds
  geometry: { coordinates: Array<[number, number]>; type: "LineString" };
};
type MapboxDirectionsResponse = {
  routes: MapboxRoute[];
};

export const mapboxMaps: MapsProvider = {
  name: "mapbox",

  async geocode(address: string): Promise<GeocodeResult | null> {
    const trimmed = address.trim();
    if (!trimmed) return null;
    const data = await mapboxFetch<MapboxGeocoderResponse>(
      `/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json`,
      { limit: "1", country: "pk" },
    );
    const feat = data?.features?.[0];
    if (!feat) return null;
    return { lng: feat.center[0], lat: feat.center[1], formatted: feat.place_name };
  },

  async reverseGeocode({ lat, lng }: Coordinates): Promise<GeocodeResult | null> {
    const data = await mapboxFetch<MapboxGeocoderResponse>(
      `/geocoding/v5/mapbox.places/${lng},${lat}.json`,
      { limit: "1" },
    );
    const feat = data?.features?.[0];
    if (!feat) return null;
    return { lng: feat.center[0], lat: feat.center[1], formatted: feat.place_name };
  },

  async distance(from: Coordinates, to: Coordinates): Promise<DistanceResult | null> {
    const route = await this.getRoute(from, to);
    if (!route) return null;
    return { meters: route.meters, minutes: route.minutes };
  },

  async getRoute(from: Coordinates, to: Coordinates): Promise<RouteGeometry | null> {
    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const data = await mapboxFetch<MapboxDirectionsResponse>(
      `/directions/v5/mapbox/driving/${coords}`,
      { geometries: "geojson", overview: "full" },
    );
    const route = data?.routes?.[0];
    if (!route) return null;
    return {
      coordinates: route.geometry.coordinates,
      meters: Math.round(route.distance),
      minutes: Math.round(route.duration / 60),
    };
  },
};
