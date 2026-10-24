import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PHARMACY_NAV } from "@/app/(pharmacy)/pharmacy-admin/_nav";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { formatPkr, formatDate } from "@/lib/formatting";

export const metadata = { title: "Pharmacy · Orders" };
export const dynamic = "force-dynamic";

export default async function PharmacyOrdersPage() {
  const session = await requireRole("PHARMACY_ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { pharmacyAdmin: true } });
  if (!me?.pharmacyAdmin) return null;

  const orders = await prisma.pharmacyOrder.findMany({
    where: { pharmacyId: me.pharmacyAdmin.id },
    include: { patient: { include: { user: true } }, items: true },
    orderBy: { createdAt: "desc" },
  });

  const cols: Column<(typeof orders)[number]>[] = [
    {
      key: "id", header: "Order", cell: (r) => (
        <Link href={`/pharmacy-admin/orders/${r.id}`} className="ge-mono text-[11.5px] hover:text-ge-primary">
          #{r.id.slice(-6).toUpperCase()}
        </Link>
      ),
    },
    { key: "p", header: "Customer", cell: (r) => r.patient.user.name },
    { key: "items", header: "Items", cell: (r) => r.items.length },
    { key: "total", header: "Total", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.totalPaisa)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={r.status as StatusKind} /> },
    { key: "when", header: "Placed", cell: (r) => formatDate(r.placedAt) },
  ];

  return (
    <AppShell navItems={PHARMACY_NAV} user={{ name: me.name, role: `Pharmacy · ${me.pharmacyAdmin.name}`, image: me.image }} title="Orders" subtitle="All orders for your pharmacy">
      <DataTable columns={cols} rows={orders} rowKey={(r) => r.id} caption={`${orders.length} total`} />
    </AppShell>
  );
}
