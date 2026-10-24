import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { NURSE_NAV } from "@/app/(nurse)/nurse/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { NurseLiveTrackingMap } from "@/components/maps/nurse-live-tracking-map";
import { getPublicMapboxToken } from "@/lib/maps";
import { formatDateTime, formatPkr } from "@/lib/formatting";
import { HomeCareStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Assignment" };

const ACTIVE: HomeCareStatus[] = [
  HomeCareStatus.ASSIGNED,
  HomeCareStatus.EN_ROUTE,
  HomeCareStatus.IN_VISIT,
];

// Pakistan centroid as fallback
const PK_CENTER: [number, number] = [69.345116, 30.375321];

export default async function NurseAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("NURSE");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { nurseProfile: { include: { city: true } } },
  });
  if (!me?.nurseProfile) return null;

  const { id } = await params;
  const req = await prisma.homeCareRequest.findUnique({
    where: { id },
    include: { patient: { include: { user: true } } },
  });
  if (!req || req.nurseId !== me.nurseProfile.id) notFound();

  const active = ACTIVE.includes(req.status);
  const initialCenter: [number, number] =
    req.addressLat != null && req.addressLng != null
      ? [req.addressLng, req.addressLat]
      : PK_CENTER;

  const publicToken = getPublicMapboxToken();

  return (
    <AppShell
      navItems={NURSE_NAV}
      user={{ name: me.name, role: `Nurse · ${me.nurseProfile.city.nameEn}`, image: me.image }}
      title="Assignment"
      subtitle={`Visit with ${req.patient.user.name}`}
    >
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card className="p-4">
          <NurseLiveTrackingMap
            homeCareRequestId={req.id}
            publicToken={publicToken}
            patientAddress={{
              lat: req.addressLat,
              lng: req.addressLng,
              line: req.addressLine,
            }}
            initialCenter={initialCenter}
            active={active}
          />
        </Card>

        <Card className="p-5">
          <Badge variant="info">{req.serviceName}</Badge>
          <div className="mt-3 flex items-center gap-2">
            <Avatar src={req.patient.user.image} name={req.patient.user.name} size={40} />
            <div>
              <div className="text-[14px] font-semibold text-ge-ink">{req.patient.user.name}</div>
              <div className="text-[11.5px] text-ge-muted">{formatDateTime(req.scheduledFor)} · {req.durationMin} min</div>
            </div>
          </div>

          <dl className="mt-4 space-y-2 text-[12.5px]">
            <div>
              <dt className="text-ge-muted">Status</dt>
              <dd className="mt-0.5"><StatusChip status={req.status as StatusKind} /></dd>
            </div>
            <div>
              <dt className="text-ge-muted">Fee</dt>
              <dd className="ge-mono mt-0.5 font-semibold text-ge-ink">{formatPkr(req.pricePaisa)}</dd>
            </div>
            <div>
              <dt className="text-ge-muted">Address</dt>
              <dd className="mt-0.5 text-ge-ink">{req.addressLine}</dd>
            </div>
            {req.description && (
              <div>
                <dt className="text-ge-muted">Notes</dt>
                <dd className="mt-0.5 text-ge-ink">{req.description}</dd>
              </div>
            )}
          </dl>

          <div className="mt-5 flex flex-col gap-2">
            {req.patient.user.phone && (
              <Button asChild size="sm" variant="secondary">
                <a href={`tel:${req.patient.user.phone}`}>
                  <Phone className="h-3.5 w-3.5" /> Call patient
                </a>
              </Button>
            )}
            <Button asChild size="sm" variant="ghost">
              <Link href="/nurse/assignments">← Back to assignments</Link>
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
