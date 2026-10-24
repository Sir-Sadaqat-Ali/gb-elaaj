import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_NAV } from "@/app/(admin)/admin/_nav";
import { ExportButton } from "@/components/data/export-button";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPkr } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Lab bookings" };

export default async function AdminLabBookingsPage() {
  const session = await requireRole("ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  const bookings = await prisma.labBooking.findMany({
    include: { patient: { include: { user: true } }, lab: true, test: true },
    orderBy: { scheduledFor: "desc" },
    take: 100,
  });

  const cols: Column<(typeof bookings)[number]>[] = [
    { key: "id", header: "Booking", cell: (r) => <span className="ge-mono text-[11.5px]">#{r.id.slice(-6).toUpperCase()}</span> },
    { key: "p", header: "Patient", cell: (r) => r.patient.user.name },
    { key: "lab", header: "Lab", cell: (r) => r.lab.name },
    { key: "test", header: "Test", cell: (r) => r.test.nameEn },
    { key: "mode", header: "Mode", cell: (r) => <Badge variant={r.mode === "HOME" ? "info" : "neutral"}>{r.mode}</Badge> },
    { key: "price", header: "Price", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.pricePaisa)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={r.status as StatusKind} /> },
    { key: "when", header: "Scheduled", cell: (r) => formatDate(r.scheduledFor) },
  ];

  return (
    <AppShell navItems={ADMIN_NAV} user={{ name: me.name, role: "Super Admin", image: me.image }} title="Lab bookings" subtitle="All lab bookings across the platform" actions={<ExportButton type="lab-bookings" />}>
      <DataTable columns={cols} rows={bookings} rowKey={(r) => r.id} caption={`${bookings.length} most recent`} />
    </AppShell>
  );
}
