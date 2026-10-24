import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PATIENT_NAV } from "@/app/(patient)/patient/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { PatientHomeCareTrackingMap } from "@/components/maps/patient-home-care-tracking-map";
import { getPublicMapboxToken } from "@/lib/maps";
import { formatDateTime } from "@/lib/formatting";
import { HomeCareStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Track home-care visit" };

const ACTIVE: HomeCareStatus[] = [
  HomeCareStatus.ASSIGNED,
  HomeCareStatus.EN_ROUTE,
  HomeCareStatus.IN_VISIT,
];

const PK_CENTER: [number, number] = [69.345116, 30.375321];

export default async function PatientHomeCareTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("PATIENT");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { patient: true },
  });
  if (!me?.patient) return null;

  const { id } = await params;
  const req = await prisma.homeCareRequest.findUnique({
    where: { id },
    include: { nurse: { include: { user: true } } },
  });
  if (!req || req.patientId !== me.patient.id) notFound();

  const active = ACTIVE.includes(req.status);
  const initialCenter: [number, number] =
    req.addressLat != null && req.addressLng != null
      ? [req.addressLng, req.addressLat]
      : PK_CENTER;
  const publicToken = getPublicMapboxToken();

  return (
    <AppShell
      navItems={PATIENT_NAV}
      user={{ name: me.name, role: "Patient", image: me.image }}
      title="Track your home-care visit"
      subtitle={req.nurse?.user.name ? `Nurse: ${req.nurse.user.name}` : "Awaiting nurse assignment"}
    >
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card className="p-4">
          <PatientHomeCareTrackingMap
            homeCareRequestId={req.id}
            publicToken={publicToken}
            initialCenter={initialCenter}
            active={active}
            patientAddressLine={req.addressLine}
          />
        </Card>

        <Card className="p-5">
          <h3 className="text-[13.5px] font-semibold text-ge-ink">Visit details</h3>
          <dl className="mt-3 space-y-2 text-[12.5px]">
            <div>
              <dt className="text-ge-muted">Service</dt>
              <dd className="mt-0.5 text-ge-ink">{req.serviceName}</dd>
            </div>
            <div>
              <dt className="text-ge-muted">Scheduled</dt>
              <dd className="mt-0.5 text-ge-ink">{formatDateTime(req.scheduledFor)}</dd>
            </div>
            <div>
              <dt className="text-ge-muted">Status</dt>
              <dd className="mt-0.5"><StatusChip status={req.status as StatusKind} /></dd>
            </div>
            {req.nurse?.user && (
              <div>
                <dt className="text-ge-muted">Nurse</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <Avatar src={req.nurse.user.image} name={req.nurse.user.name} size={28} />
                  <span className="text-ge-ink">{req.nurse.user.name}</span>
                </dd>
              </div>
            )}
          </dl>
          <div className="mt-5">
            <Button asChild size="sm" variant="secondary">
              <Link href="/patient/home-care">← Back</Link>
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
