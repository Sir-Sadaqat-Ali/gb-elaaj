"use client";

// Patient-perspective tracking — read-only.
// Polls /api/location/latest and /api/location/route on a timer.

import * as React from "react";
import { Clock, Navigation, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapboxMap } from "@/components/maps/mapbox-map";
import { TrackingStatusBadge } from "@/components/maps/tracking-status-badge";

export type PatientHomeCareTrackingMapProps = {
  homeCareRequestId: string;
  publicToken?: string;
  styleUrl?: string;
  initialCenter: [number, number];
  pollIntervalMs?: number;
  // Whether the request is in an active status. We stop polling when not active.
  active: boolean;
  patientAddressLine: string;
};

type LatestResponse = {
  ok: boolean;
  data?: {
    available: boolean;
    lat?: number;
    lng?: number;
    lastUpdatedAt?: string;
    ageSeconds?: number;
    stale?: boolean;
    addressLat?: number | null;
    addressLng?: number | null;
    status?: string;
  };
};
type RouteResponse = {
  ok: boolean;
  data?: {
    available: boolean;
    coordinates?: Array<[number, number]>;
    meters?: number;
    minutes?: number;
  };
};

export function PatientHomeCareTrackingMap({
  homeCareRequestId,
  publicToken,
  styleUrl,
  initialCenter,
  pollIntervalMs = 5000,
  active,
  patientAddressLine,
}: PatientHomeCareTrackingMapProps) {
  const [latest, setLatest] = React.useState<LatestResponse["data"] | null>(null);
  const [route, setRoute] = React.useState<RouteResponse["data"] | null>(null);
  const [polling, setPolling] = React.useState(active);
  const [error, setError] = React.useState<string | null>(null);

  const fetchOnce = React.useCallback(async () => {
    try {
      const r = await fetch(
        `/api/location/latest?homeCareRequestId=${encodeURIComponent(homeCareRequestId)}`,
      );
      const j: LatestResponse = await r.json();
      if (!j.ok) throw new Error("latest fetch failed");
      setLatest(j.data ?? null);

      // Only call /route when we have nurse coords
      if (j.data?.available) {
        const rr = await fetch(
          `/api/location/route?homeCareRequestId=${encodeURIComponent(homeCareRequestId)}`,
        );
        const rj: RouteResponse = await rr.json();
        if (rj.ok) setRoute(rj.data ?? null);
      } else {
        setRoute(null);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    }
  }, [homeCareRequestId]);

  React.useEffect(() => {
    if (!polling) return;
    fetchOnce();
    const id = setInterval(fetchOnce, pollIntervalMs);
    return () => clearInterval(id);
  }, [polling, fetchOnce, pollIntervalMs]);

  // Stop polling when assignment becomes inactive
  React.useEffect(() => {
    if (!active) setPolling(false);
  }, [active]);

  const markers = React.useMemo(() => {
    const list: Array<{ id: string; lat: number; lng: number; color?: string; label?: string; pulse?: boolean }> = [];
    if (latest?.available && latest.lat != null && latest.lng != null) {
      list.push({
        id: "nurse",
        lat: latest.lat,
        lng: latest.lng,
        color: "#0B84FE",
        label: "Nurse",
        pulse: !latest.stale,
      });
    }
    if (latest?.addressLat != null && latest.addressLng != null) {
      list.push({
        id: "patient",
        lat: latest.addressLat,
        lng: latest.addressLng,
        color: "#10B981",
        label: "You",
      });
    }
    return list;
  }, [latest]);

  const status: "live" | "stale" | "offline" | "ended" =
    !active
      ? "ended"
      : !latest?.available
      ? "offline"
      : latest.stale
      ? "stale"
      : "live";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TrackingStatusBadge status={status} ageSeconds={latest?.ageSeconds} />
        <Button size="sm" variant="secondary" onClick={fetchOnce} aria-label="Refresh">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <MapboxMap
        publicToken={publicToken}
        styleUrl={styleUrl}
        center={
          latest?.available && latest.lat != null && latest.lng != null
            ? [latest.lng, latest.lat]
            : initialCenter
        }
        zoom={13}
        markers={markers}
        routeCoordinates={route?.available ? route.coordinates : undefined}
        autoFit
        ariaLabel="Patient home-care tracking map"
        className="aspect-[16/10] w-full"
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          label="Distance"
          value={
            route?.available && typeof route.meters === "number"
              ? `${(route.meters / 1000).toFixed(1)} km`
              : "—"
          }
          icon={Navigation}
        />
        <Stat
          label="ETA"
          value={
            route?.available && typeof route.minutes === "number"
              ? `${route.minutes} min`
              : "—"
          }
          icon={Clock}
        />
        <Stat label="Updated" value={latest?.ageSeconds != null ? `${latest.ageSeconds}s ago` : "—"} icon={RefreshCw} />
        <Stat label="Status" value={latest?.status ?? "—"} icon={Navigation} />
      </div>

      <p className="text-[11.5px] text-ge-muted">Address: {patientAddressLine}</p>
      {error && (
        <p role="alert" className="text-[11.5px] text-[color:var(--ge-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-md border border-ge-border bg-white px-3 py-2">
      <div className="inline-flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-wide text-ge-muted">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="ge-mono mt-0.5 text-[13px] font-semibold text-ge-ink">{value}</div>
    </div>
  );
}
