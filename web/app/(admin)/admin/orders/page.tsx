import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_NAV } from "@/app/(admin)/admin/_nav";
import { ExportButton } from "@/components/data/export-button";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { formatPkr, formatDate } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin · Orders" };

export default async function AdminOrdersPage() {
  const session = await requireRole("ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  const orders = await prisma.pharmacyOrder.findMany({
    include: { patient: { include: { user: true } }, pharmacy: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const cols: Column<(typeof orders)[number]>[] = [
    { key: "id", header: "Order", cell: (r) => <span className="ge-mono text-[11.5px]">#{r.id.slice(-6).toUpperCase()}</span> },
    { key: "p", header: "Patient", cell: (r) => r.patient.user.name },
    { key: "pharm", header: "Pharmacy", cell: (r) => r.pharmacy.name },
    { key: "items", header: "Items", cell: (r) => r.items.length },
    { key: "total", header: "Total", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.totalPaisa)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={r.status as StatusKind} /> },
    { key: "when", header: "Placed", cell: (r) => formatDate(r.placedAt) },
  ];

  return (
    <AppShell navItems={ADMIN_NAV} user={{ name: me.name, role: "Super Admin", image: me.image }} title="Pharmacy orders" subtitle="All pharmacy orders across the platform" actions={<ExportButton type="pharmacy-orders" />}>
      <DataTable columns={cols} rows={orders} rowKey={(r) => r.id} caption={`${orders.length} most recent`} />
    </AppShell>
  );
}
