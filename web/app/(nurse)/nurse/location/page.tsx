import { Activity, Clock, MapPin, Navigation, Phone } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { NURSE_NAV } from "@/app/(nurse)/nurse/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/data/empty-state";
import { MapboxMap } from "@/components/maps/mapbox-map";
import { getPublicMapboxToken } from "@/lib/maps";
import { formatTime } from "@/lib/formatting";

export const metadata = { title: "Location & route" };
export const dynamic = "force-dynamic";

const PK_CENTER: [number, number] = [69.345116, 30.375321];

// Universal "open in maps" link — uses geo: URI scheme on mobile (handled by
// any installed maps app: Apple Maps, Mapbox, OSMAnd, etc.); falls back to
// Mapbox's web URL on desktop. Deliberately not using google.com/maps.
function openInMapsHref(addressLine: string, lat?: number | null, lng?: number | null): string {
  if (lat != null && lng != null) {
    // geo: scheme is honoured on Android + iOS; desktop browsers map this
    // through to Apple Maps / installed default. The query suffix gives a
    // human-readable label.
    return `geo:${lat},${lng}?q=${encodeURIComponent(addressLine)}`;
  }
  // Without coords, fall back to a search-style geo URI
  return `geo:0,0?q=${encodeURIComponent(addressLine)}`;
}

export default async function NurseLocationPage() {
  const session = await requireRole("NURSE");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { nurseProfile: { include: { city: true } } },
  });
  if (!me?.nurseProfile) return null;

  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

  const todays = await prisma.homeCareRequest.findMany({
    where: {
      nurseId: me.nurseProfile.id,
      scheduledFor: { gte: startOfDay, lte: endOfDay },
    },
    include: { patient: { include: { user: true } } },
    orderBy: { scheduledFor: "asc" },
  });

  const completed = todays.filter((t) => t.status === "COMPLETED").length;
  const next = todays.find((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED");

  // Markers from real geocoded coords (nullable until geocoder runs)
  const markers = todays
    .filter((t) => t.addressLat != null && t.addressLng != null)
    .map((t, i) => ({
      id: t.id,
      lat: t.addressLat as number,
      lng: t.addressLng as number,
      color:
        t.status === "COMPLETED"
          ? "#10B981"
          : t.status === "IN_VISIT"
          ? "#F59E0B"
          : "#0B84FE",
      label: `${i + 1}. ${t.patient.user.name}`,
    }));

  // Initial center: next visit's address, else first address with coords, else PK centroid
  const focused =
    (next && next.addressLat != null && next.addressLng != null && [next.addressLng, next.addressLat]) ||
    (markers[0] && [markers[0].lng, markers[0].lat]) ||
    PK_CENTER;

  const publicToken = getPublicMapboxToken();

  return (
    <AppShell
      navItems={NURSE_NAV}
      user={{ name: me.name, role: `Nurse · ${me.nurseProfile.city.nameEn}`, image: me.image }}
      title="Location & route"
      subtitle="Today's visits with addresses and quick navigation."
    >
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card className="overflow-hidden p-0">
          <MapboxMap
            publicToken={publicToken}
            center={focused as [number, number]}
            zoom={11}
            markers={markers}
            autoFit
            ariaLabel="Today's visits"
            className="aspect-[16/10] w-full"
          />
          <div className="grid grid-cols-3 gap-0 border-t border-ge-border text-center">
            <Stat label="Visits" value={String(todays.length)} icon={MapPin} />
            <Stat label="Completed" value={String(completed)} icon={Activity} />
            <Stat label="Plotted" value={String(markers.length)} icon={Navigation} />
          </div>
        </Card>

        <div className="space-y-4">
          {next ? (
            <Card className="p-5">
              <Badge variant="info">Next visit</Badge>
              <h3 className="mt-2 text-[14px] font-semibold text-ge-ink">{next.serviceName}</h3>
              <div className="mt-2 flex items-center gap-2">
                <Avatar src={next.patient.user.image} name={next.patient.user.name} size={32} />
                <div>
                  <div className="text-[12.5px] font-semibold text-ge-ink">{next.patient.user.name}</div>
                  <div className="text-[10.5px] text-ge-muted">
                    <Clock className="mr-0.5 inline h-3 w-3" />
                    {formatTime(next.scheduledFor)} · {next.durationMin} min
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-md bg-ge-soft-bg p-2.5 text-[12px] text-ge-ink">
                <MapPin className="mr-1 inline h-3 w-3 text-ge-primary" />
                {next.addressLine}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <Button asChild size="sm">
                  <Link href={`/nurse/assignments/${next.id}`}>
                    <Navigation className="h-3.5 w-3.5" /> Open assignment
                  </Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <a
                    href={openInMapsHref(next.addressLine, next.addressLat, next.addressLng)}
                    target="_blank"
                    rel="noopener"
                  >
                    <MapPin className="h-3.5 w-3.5" /> Open in Maps
                  </a>
                </Button>
                {next.patient.user.phone && (
                  <Button asChild size="sm" variant="ghost">
                    <a href={`tel:${next.patient.user.phone}`}>
                      <Phone className="h-3.5 w-3.5" /> Call patient
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-5">
              <EmptyState
                icon={MapPin}
                title="No upcoming visits today"
                body="Once a request is assigned to you it will appear here with directions."
              />
            </Card>
          )}

          <Card className="p-5">
            <h3 className="text-[13.5px] font-semibold text-ge-ink">Today's route</h3>
            {todays.length === 0 ? (
              <p className="mt-2 text-[12px] text-ge-muted">Nothing scheduled today.</p>
            ) : (
              <ol className="mt-3 space-y-3">
                {todays.map((t, i) => (
                  <li key={t.id} className="flex items-start gap-2.5">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ge-primary/10 text-[10px] font-semibold text-ge-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12.5px] font-semibold text-ge-ink">{t.patient.user.name}</span>
                        <StatusChip status={t.status as StatusKind} />
                      </div>
                      <div className="text-[10.5px] text-ge-muted">
                        {formatTime(t.scheduledFor)} · {t.serviceName}
                      </div>
                      <div className="mt-1 text-[11px] text-ge-ink">
                        <MapPin className="mr-0.5 inline h-3 w-3 text-ge-muted" />
                        {t.addressLine}
                      </div>
                      <Link
                        href={`/nurse/assignments/${t.id}`}
                        className="mt-1 inline-block text-[11px] font-semibold text-ge-primary hover:underline"
                      >
                        Open →
                      </Link>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof MapPin }) {
  return (
    <div className="border-r border-ge-border p-3 last:border-r-0">
      <div className="inline-flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-wide text-ge-muted">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="ge-mono mt-1 text-[15px] font-semibold text-ge-ink">{value}</div>
    </div>
  );
}
