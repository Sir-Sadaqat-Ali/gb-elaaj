"use client";

// Base Mapbox GL wrapper.
// Lazy-loads the SDK on mount so it doesn't bloat the initial bundle.
// Receives only the public token via prop — never the secret token.

import * as React from "react";
import { cn } from "@/lib/utils";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  color?: string;
  label?: string;
  pulse?: boolean;
};

export type MapboxMapProps = {
  publicToken?: string;
  styleUrl?: string;
  center: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: MapMarker[];
  // GeoJSON LineString coords [[lng, lat], ...]
  routeCoordinates?: Array<[number, number]>;
  // Auto-fit bounds to markers + route on each change
  autoFit?: boolean;
  className?: string;
  ariaLabel?: string;
};

const DEFAULT_STYLE = "mapbox://styles/mapbox/streets-v12";

export function MapboxMap({
  publicToken,
  styleUrl = DEFAULT_STYLE,
  center,
  zoom = 12,
  markers = [],
  routeCoordinates,
  autoFit = true,
  className,
  ariaLabel = "Map",
}: MapboxMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<unknown>(null); // mapboxgl.Map
  const markerObjsRef = React.useRef<unknown[]>([]); // mapboxgl.Marker[]
  const [error, setError] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  // Init map — runs once
  React.useEffect(() => {
    if (!containerRef.current) return;
    if (!publicToken) {
      setError("Map unavailable — token not configured.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("mapbox-gl");
        if (cancelled) return;
        // CSS import via dynamic require — TS doesn't have types for the
        // CSS module path, but Next.js handles it at build time.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error -- CSS import path has no .d.ts; safe at runtime
        await import("mapbox-gl/dist/mapbox-gl.css");
        const mapboxgl = mod.default;
        mapboxgl.accessToken = publicToken;
        const map = new mapboxgl.Map({
          container: containerRef.current!,
          style: styleUrl,
          center,
          zoom,
          attributionControl: true,
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
        map.on("load", () => {
          if (cancelled) return;
          setLoaded(true);
        });
        mapRef.current = map;
      } catch (e) {
        if (!cancelled) setError("Failed to load map.");
        console.error("[mapbox-map] init failed:", e);
      }
    })();
    return () => {
      cancelled = true;
      const map = mapRef.current as { remove?: () => void } | null;
      if (map?.remove) map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicToken, styleUrl]);

  // Update markers
  React.useEffect(() => {
    if (!loaded) return;
    const map = mapRef.current as {
      flyTo?: (opts: unknown) => void;
      fitBounds?: (b: unknown, opts?: unknown) => void;
    } | null;
    if (!map) return;
    (async () => {
      const mod = await import("mapbox-gl");
      const mapboxgl = mod.default;

      // Tear down existing markers
      for (const m of markerObjsRef.current) {
        const obj = m as { remove?: () => void };
        if (obj.remove) obj.remove();
      }
      markerObjsRef.current = [];

      for (const mk of markers) {
        const el = document.createElement("div");
        el.className = "ge-map-marker";
        el.style.cssText = [
          "width:18px",
          "height:18px",
          "border-radius:50%",
          `background:${mk.color ?? "#0B84FE"}`,
          "border:3px solid #fff",
          "box-shadow:0 2px 8px rgba(0,0,0,.25)",
          mk.pulse ? "animation:ge-pulse 2s ease-out infinite" : "",
        ].join(";");

        const popup = mk.label
          ? new mapboxgl.Popup({ offset: 16, closeButton: false }).setText(mk.label)
          : undefined;

        const obj = new mapboxgl.Marker({ element: el })
          .setLngLat([mk.lng, mk.lat])
          .setPopup(popup ?? null)
          .addTo(map as never);
        markerObjsRef.current.push(obj);
      }

      // Auto-fit
      if (autoFit && (markers.length > 0 || routeCoordinates?.length)) {
        const points: Array<[number, number]> = [
          ...markers.map((m) => [m.lng, m.lat] as [number, number]),
          ...(routeCoordinates ?? []),
        ];
        if (points.length === 1) {
          map.flyTo?.({ center: points[0], zoom: 14, essential: true });
        } else if (points.length > 1) {
          const bounds = new mapboxgl.LngLatBounds(points[0], points[0]);
          for (const p of points) bounds.extend(p);
          map.fitBounds?.(bounds, { padding: 56, maxZoom: 15, duration: 600 });
        }
      }
    })();
  }, [loaded, markers, routeCoordinates, autoFit]);

  // Update / clear route layer
  React.useEffect(() => {
    if (!loaded) return;
    const map = mapRef.current as {
      getSource?: (id: string) => unknown;
      addSource?: (id: string, src: unknown) => void;
      addLayer?: (l: unknown) => void;
      removeLayer?: (id: string) => void;
      removeSource?: (id: string) => void;
    } | null;
    if (!map) return;

    const SRC = "ge-route";
    const LAYER = "ge-route-line";

    if (map.getSource?.(SRC)) {
      try {
        map.removeLayer?.(LAYER);
      } catch {}
      try {
        map.removeSource?.(SRC);
      } catch {}
    }

    if (!routeCoordinates || routeCoordinates.length < 2) return;

    map.addSource?.(SRC, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: routeCoordinates },
      },
    });
    map.addLayer?.({
      id: LAYER,
      type: "line",
      source: SRC,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#0B84FE",
        "line-width": 4,
        "line-opacity": 0.85,
      },
    });
  }, [loaded, routeCoordinates]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={ariaLabel}
      className={cn("relative w-full overflow-hidden rounded-lg bg-ge-soft-bg", className)}
    >
      <style jsx global>{`
        @keyframes ge-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(11,132,254,.6), 0 2px 8px rgba(0,0,0,.25); }
          70%  { box-shadow: 0 0 0 14px rgba(11,132,254,0), 0 2px 8px rgba(0,0,0,.25); }
          100% { box-shadow: 0 0 0 0 rgba(11,132,254,0), 0 2px 8px rgba(0,0,0,.25); }
        }
      `}</style>
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <div>
            <p className="text-[12.5px] font-semibold text-ge-ink">{error}</p>
            <p className="mt-1 text-[11px] text-ge-muted">
              Set <code>NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to enable maps.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
