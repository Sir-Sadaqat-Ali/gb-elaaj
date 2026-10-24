import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_NAV } from "@/app/(admin)/admin/_nav";
import { Card } from "@/components/ui/card";
import { AdminNurseTrackingMap } from "@/components/maps/admin-nurse-tracking-map";
import { getPublicMapboxToken } from "@/lib/maps";
import { HomeCareStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nurse tracking" };

const PK_CENTER: [number, number] = [69.345116, 30.375321];

export default async function AdminNurseTrackingPage() {
  const session = await requireRole("ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  const items = await prisma.homeCareRequest.findMany({
    where: {
      status: { in: [HomeCareStatus.ASSIGNED, HomeCareStatus.EN_ROUTE, HomeCareStatus.IN_VISIT] },
      nurseId: { not: null },
    },
    include: {
      patient: { include: { user: true } },
      nurse: { include: { user: true } },
    },
    orderBy: { scheduledFor: "asc" },
  });

  const trackingItems = items.map((it) => ({
    homeCareRequestId: it.id,
    nurseName: it.nurse?.user.name ?? "Unassigned",
    patientName: it.patient.user.name,
    status: it.status,
    scheduledFor: it.scheduledFor.toISOString(),
    addressLine: it.addressLine,
    lastNurseLat: it.lastNurseLat,
    lastNurseLng: it.lastNurseLng,
    lastLocationAt: it.lastLocationAt?.toISOString() ?? null,
    addressLat: it.addressLat,
    addressLng: it.addressLng,
  }));

  const publicToken = getPublicMapboxToken();

  return (
    <AppShell
      navItems={ADMIN_NAV}
      user={{ name: me.name, role: "Admin", image: me.image }}
      title="Nurse tracking"
      subtitle={`${trackingItems.length} active assignment${trackingItems.length === 1 ? "" : "s"}`}
    >
      <Card className="p-4">
        <AdminNurseTrackingMap
          items={trackingItems}
          publicToken={publicToken}
          initialCenter={PK_CENTER}
        />
      </Card>
    </AppShell>
  );
}
