"use client";

// Admin-perspective tracking — read all active assignments on a single map.
// Polls every nurse/request through individual /latest calls (small N expected).
// Clicking a row centers the map on that assignment.

import * as React from "react";
import { MapboxMap } from "@/components/maps/mapbox-map";
import { TrackingStatusBadge } from "@/components/maps/tracking-status-badge";
import { cn } from "@/lib/utils";

export type AdminTrackingItem = {
  homeCareRequestId: string;
  nurseName: string;
  patientName: string;
  status: string;
  scheduledFor: string; // ISO
  addressLine: string;
  // Server-side initial snapshot:
  lastNurseLat: number | null;
  lastNurseLng: number | null;
  lastLocationAt: string | null;
  addressLat: number | null;
  addressLng: number | null;
};

export type AdminNurseTrackingMapProps = {
  items: AdminTrackingItem[];
  publicToken?: string;
  styleUrl?: string;
  initialCenter: [number, number];
  pollIntervalMs?: number;
};

type LiveSnapshot = {
  lat: number | null;
  lng: number | null;
  lastUpdatedAt: string | null;
  ageSeconds: number | null;
  stale: boolean;
};

export function AdminNurseTrackingMap({
  items,
  publicToken,
  styleUrl,
  initialCenter,
  pollIntervalMs = 6000,
}: AdminNurseTrackingMapProps) {
  const [live, setLive] = React.useState<Record<string, LiveSnapshot>>(() => {
    const init: Record<string, LiveSnapshot> = {};
    for (const it of items) {
      init[it.homeCareRequestId] = {
        lat: it.lastNurseLat,
        lng: it.lastNurseLng,
        lastUpdatedAt: it.lastLocationAt,
        ageSeconds: it.lastLocationAt
          ? Math.round((Date.now() - new Date(it.lastLocationAt).getTime()) / 1000)
          : null,
        stale: it.lastLocationAt
          ? Date.now() - new Date(it.lastLocationAt).getTime() > 90_000
          : true,
      };
    }
    return init;
  });
  const [selected, setSelected] = React.useState<string | null>(items[0]?.homeCareRequestId ?? null);

  const refresh = React.useCallback(async () => {
    const updates = await Promise.allSettled(
      items.map(async (it) => {
        const r = await fetch(
          `/api/location/latest?homeCareRequestId=${encodeURIComponent(it.homeCareRequestId)}`,
        );
        const j = await r.json();
        return [it.homeCareRequestId, j] as const;
      }),
    );
    setLive((prev) => {
      const next = { ...prev };
      for (const u of updates) {
        if (u.status !== "fulfilled") continue;
        const [id, j] = u.value;
        if (!j?.ok) continue;
        if (j.data?.available) {
          next[id] = {
            lat: j.data.lat,
            lng: j.data.lng,
            lastUpdatedAt: j.data.lastUpdatedAt,
            ageSeconds: j.data.ageSeconds,
            stale: j.data.stale,
          };
        } else {
          next[id] = { lat: null, lng: null, lastUpdatedAt: null, ageSeconds: null, stale: true };
        }
      }
      return next;
    });
  }, [items]);

  React.useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(id);
  }, [refresh, pollIntervalMs]);

  const markers = React.useMemo(() => {
    return items.flatMap((it) => {
      const snap = live[it.homeCareRequestId];
      const list = [];
      if (snap?.lat != null && snap?.lng != null) {
        list.push({
          id: `n-${it.homeCareRequestId}`,
          lat: snap.lat,
          lng: snap.lng,
          color: snap.stale ? "#F59E0B" : "#0B84FE",
          label: `${it.nurseName} → ${it.patientName}`,
          pulse: !snap.stale,
        });
      }
      if (it.addressLat != null && it.addressLng != null) {
        list.push({
          id: `p-${it.homeCareRequestId}`,
          lat: it.addressLat,
          lng: it.addressLng,
          color: "#10B981",
          label: it.patientName,
        });
      }
      return list;
    });
  }, [items, live]);

  const selectedItem = items.find((i) => i.homeCareRequestId === selected) ?? null;
  const selectedSnap = selected ? live[selected] : undefined;
  const center: [number, number] =
    selectedSnap?.lat != null && selectedSnap.lng != null
      ? [selectedSnap.lng, selectedSnap.lat]
      : selectedItem?.addressLat != null && selectedItem.addressLng != null
      ? [selectedItem.addressLng, selectedItem.addressLat]
      : initialCenter;

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_320px]">
      <MapboxMap
        publicToken={publicToken}
        styleUrl={styleUrl}
        center={center}
        zoom={11}
        markers={markers}
        autoFit={items.length > 0}
        ariaLabel="Admin nurse tracking map"
        className="aspect-[4/3] w-full md:aspect-auto md:h-[64vh]"
      />

      <div className="flex flex-col gap-2 overflow-auto md:max-h-[64vh]">
        {items.length === 0 ? (
          <p className="rounded-md border border-ge-border bg-ge-soft-bg p-4 text-[12.5px] text-ge-muted">
            No active home-care assignments.
          </p>
        ) : (
          items.map((it) => {
            const snap = live[it.homeCareRequestId];
            const status: "live" | "stale" | "offline" =
              !snap || snap.lat == null
                ? "offline"
                : snap.stale
                ? "stale"
                : "live";
            return (
              <button
                key={it.homeCareRequestId}
                type="button"
                onClick={() => setSelected(it.homeCareRequestId)}
                className={cn(
                  "rounded-md border p-3 text-left transition",
                  selected === it.homeCareRequestId
                    ? "border-ge-primary bg-ge-primary/5"
                    : "border-ge-border bg-white hover:bg-ge-soft-bg",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold text-ge-ink">
                      {it.nurseName} <span className="text-ge-muted">→</span> {it.patientName}
                    </div>
                    <div className="text-[10.5px] text-ge-muted">
                      {it.status} · {new Date(it.scheduledFor).toLocaleTimeString()}
                    </div>
                  </div>
                  <TrackingStatusBadge
                    status={status}
                    ageSeconds={snap?.ageSeconds ?? undefined}
                  />
                </div>
                <p className="mt-1 truncate text-[11px] text-ge-muted">{it.addressLine}</p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
