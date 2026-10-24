// Maps provider types — shared by mock and Mapbox.

export type Coordinates = { lat: number; lng: number };

export type DistanceResult = { meters: number; minutes: number };

export type RouteGeometry = {
  // GeoJSON LineString coordinates: [[lng, lat], ...]
  coordinates: Array<[number, number]>;
  meters: number;
  minutes: number;
};

export type GeocodeResult = {
  lat: number;
  lng: number;
  // Mapbox returns a normalized "place_name" — useful for showing back to the user
  formatted: string;
};

export interface MapsProvider {
  readonly name: string;
  geocode(address: string): Promise<GeocodeResult | null>;
  reverseGeocode(coords: Coordinates): Promise<GeocodeResult | null>;
  distance(from: Coordinates, to: Coordinates): Promise<DistanceResult | null>;
  getRoute(from: Coordinates, to: Coordinates): Promise<RouteGeometry | null>;
}
