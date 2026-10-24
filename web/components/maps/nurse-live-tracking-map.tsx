"use client";

// Nurse-perspective live tracking.
// Nurse explicitly clicks "Start sharing" to begin watchPosition; clicking
// "Stop sharing" tears down the watcher. We post each ping to /api/location/update.
// Auto-stops when status leaves the active set (server enforces too).

import * as React from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapboxMap } from "@/components/maps/mapbox-map";
import { TrackingStatusBadge } from "@/components/maps/tracking-status-badge";
import { LocationPermissionState } from "@/components/maps/location-permission-state";

export type NurseLiveTrackingMapProps = {
  homeCareRequestId: string;
  publicToken?: string;
  styleUrl?: string;
  patientAddress: { lat: number | null; lng: number | null; line: string };
  // Initial center fallback: city center, request address, or Pakistan centroid
  initialCenter: [number, number];
  // Whether tracking is allowed (status active)
  active: boolean;
};

const POST_INTERVAL_MS = 8_000; // throttle: at most 1 update / 8s

export function NurseLiveTrackingMap({
  homeCareRequestId,
  publicToken,
  styleUrl,
  patientAddress,
  initialCenter,
  active,
}: NurseLiveTrackingMapProps) {
  const [sharing, setSharing] = React.useState(false);
  const [permission, setPermission] = React.useState<"prompt" | "denied" | "unavailable" | "granted">(
    "prompt",
  );
  const [pos, setPos] = React.useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [lastPostAt, setLastPostAt] = React.useState<number>(0);
  const watchIdRef = React.useRef<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const stopSharing = React.useCallback(() => {
    if (watchIdRef.current != null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setSharing(false);
  }, []);

  const startSharing = React.useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermission("unavailable");
      return;
    }
    setError(null);
    const id = navigator.geolocation.watchPosition(
      (geo) => {
        setPermission("granted");
        const p = {
          lat: geo.coords.latitude,
          lng: geo.coords.longitude,
          accuracy: geo.coords.accuracy,
        };
        setPos(p);
        const now = Date.now();
        if (now - lastPostAt < POST_INTERVAL_MS) return;
        setLastPostAt(now);
        // Fire-and-forget; UI doesn't block on this
        fetch("/api/location/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            homeCareRequestId,
            latitude: p.lat,
            longitude: p.lng,
            accuracy: p.accuracy,
            heading: geo.coords.heading ?? undefined,
            speed: geo.coords.speed ?? undefined,
            source: "browser",
          }),
        }).catch(() => {
          // Network blip — keep tracking; next ping will retry
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setPermission("denied");
        else if (err.code === err.POSITION_UNAVAILABLE) setPermission("unavailable");
        else setError(err.message);
        stopSharing();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    watchIdRef.current = id;
    setSharing(true);
  }, [homeCareRequestId, lastPostAt, stopSharing]);

  // Auto-stop when assignment is no longer active
  React.useEffect(() => {
    if (!active && sharing) stopSharing();
  }, [active, sharing, stopSharing]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (watchIdRef.current != null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const markers = React.useMemo(() => {
    const list: Array<{ id: string; lat: number; lng: number; color?: string; label?: string; pulse?: boolean }> = [];
    if (pos) {
      list.push({ id: "me", lat: pos.lat, lng: pos.lng, color: "#0B84FE", label: "You", pulse: true });
    }
    if (patientAddress.lat != null && patientAddress.lng != null) {
      list.push({
        id: "patient",
        lat: patientAddress.lat,
        lng: patientAddress.lng,
        color: "#10B981",
        label: "Patient",
      });
    }
    return list;
  }, [pos, patientAddress.lat, patientAddress.lng]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TrackingStatusBadge
          status={!active ? "ended" : sharing ? "live" : "offline"}
          ageSeconds={sharing ? 0 : undefined}
        />
        {active && (
          sharing ? (
            <Button size="sm" variant="secondary" onClick={stopSharing}>
              <Square className="h-3.5 w-3.5" /> Stop sharing
            </Button>
          ) : (
            <Button size="sm" onClick={startSharing} disabled={permission === "denied"}>
              <Play className="h-3.5 w-3.5" /> Start sharing location
            </Button>
          )
        )}
      </div>

      {permission === "denied" && (
        <LocationPermissionState variant="denied" onRetry={startSharing} />
      )}
      {permission === "unavailable" && (
        <LocationPermissionState variant="unavailable" onRetry={startSharing} />
      )}
      {error && (
        <p role="alert" className="text-[12px] text-[color:var(--ge-danger)]">
          {error}
        </p>
      )}

      <MapboxMap
        publicToken={publicToken}
        styleUrl={styleUrl}
        center={pos ? [pos.lng, pos.lat] : initialCenter}
        zoom={13}
        markers={markers}
        autoFit
        ariaLabel="Nurse live tracking map"
        className="aspect-[16/10] w-full"
      />

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11.5px] text-ge-muted">
        <span>Patient address: {patientAddress.line}</span>
        {pos?.accuracy != null && (
          <span>GPS accuracy: ±{Math.round(pos.accuracy)} m</span>
        )}
      </div>
    </div>
  );
}
