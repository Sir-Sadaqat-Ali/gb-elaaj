import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { LAB_NAV } from "@/app/(lab)/lab-admin/_nav";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { formatPkr, formatDateTime } from "@/lib/formatting";

export const metadata = { title: "Lab · Bookings" };
export const dynamic = "force-dynamic";

export default async function LabBookingsPage() {
  const session = await requireRole("LAB_ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { labAdmin: true } });
  if (!me?.labAdmin) return null;

  const bookings = await prisma.labBooking.findMany({
    where: { labId: me.labAdmin.id },
    include: { patient: { include: { user: true } }, test: true },
    orderBy: { scheduledFor: "desc" },
  });

  const cols: Column<(typeof bookings)[number]>[] = [
    {
      key: "id", header: "Booking", cell: (r) => (
        <Link href={`/lab-admin/bookings/${r.id}`} className="ge-mono text-[11.5px] hover:text-ge-primary">
          #{r.id.slice(-6).toUpperCase()}
        </Link>
      ),
    },
    { key: "p", header: "Patient", cell: (r) => r.patient.user.name },
    { key: "test", header: "Test", cell: (r) => r.test.nameEn },
    { key: "mode", header: "Mode", cell: (r) => r.mode },
    { key: "price", header: "Price", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.pricePaisa)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={r.status as StatusKind} /> },
    { key: "when", header: "Scheduled", cell: (r) => formatDateTime(r.scheduledFor) },
  ];

  return (
    <AppShell navItems={LAB_NAV} user={{ name: me.name, role: `Lab · ${me.labAdmin.name}`, image: me.image }} title="Bookings" subtitle={`${bookings.length} total bookings`}>
      <DataTable columns={cols} rows={bookings} rowKey={(r) => r.id} />
    </AppShell>
  );
}
