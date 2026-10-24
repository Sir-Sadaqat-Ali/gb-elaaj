// Mock maps provider — Pakistan city look-up + Haversine distance.
// Keeps the dev experience working without a Mapbox token.

import type {
  Coordinates,
  DistanceResult,
  GeocodeResult,
  MapsProvider,
  RouteGeometry,
} from "../types";

const PK_CITIES: Record<string, Coordinates> = {
  gilgit:     { lat: 35.9208, lng: 74.3144 },
  skardu:     { lat: 35.2971, lng: 75.6315 },
  hunza:      { lat: 36.3167, lng: 74.6500 },
  islamabad:  { lat: 33.6844, lng: 73.0479 },
  lahore:     { lat: 31.5497, lng: 74.3436 },
  karachi:    { lat: 24.8607, lng: 67.0011 },
  peshawar:   { lat: 34.0151, lng: 71.5249 },
  rawalpindi: { lat: 33.5651, lng: 73.0169 },
};

function haversineMeters(from: Coordinates, to: Coordinates): number {
  const R = 6_371_000;
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δφ = ((to.lat - from.lat) * Math.PI) / 180;
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const mockMaps: MapsProvider = {
  name: "mock",

  async geocode(address: string): Promise<GeocodeResult | null> {
    const key = Object.keys(PK_CITIES).find((c) => address.toLowerCase().includes(c));
    if (!key) return null;
    const { lat, lng } = PK_CITIES[key];
    return { lat, lng, formatted: `${key} (mock)` };
  },

  async reverseGeocode({ lat, lng }: Coordinates): Promise<GeocodeResult | null> {
    return { lat, lng, formatted: `${lat.toFixed(4)}, ${lng.toFixed(4)} (mock)` };
  },

  async distance(from: Coordinates, to: Coordinates): Promise<DistanceResult | null> {
    const meters = haversineMeters(from, to);
    return {
      meters: Math.round(meters),
      minutes: Math.round((meters / 1000 / 40) * 60), // 40 km/h avg
    };
  },

  async getRoute(from: Coordinates, to: Coordinates): Promise<RouteGeometry | null> {
    const meters = haversineMeters(from, to);
    return {
      // Mock route is a straight line between the two points.
      coordinates: [
        [from.lng, from.lat],
        [to.lng, to.lat],
      ],
      meters: Math.round(meters),
      minutes: Math.round((meters / 1000 / 40) * 60),
    };
  },
};
