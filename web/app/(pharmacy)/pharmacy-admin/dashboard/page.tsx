import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PHARMACY_NAV } from "@/app/(pharmacy)/pharmacy-admin/_nav";
import { Kpi } from "@/components/data/kpi";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/data/empty-state";
import { Bell, Box, Pill, Truck, Wallet } from "lucide-react";
import { formatPkr, formatPkrCompact, formatDate } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pharmacy · Overview" };

export default async function PharmacyDashboardPage() {
  const session = await requireRole("PHARMACY_ADMIN");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { pharmacyAdmin: { include: { city: true } } },
  });
  if (!me?.pharmacyAdmin) return null;
  const pharm = me.pharmacyAdmin;

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [totalOrders, todaysOrders, lowStock, monthRevenue, recent] = await Promise.all([
    prisma.pharmacyOrder.count({ where: { pharmacyId: pharm.id } }),
    prisma.pharmacyOrder.count({
      where: {
        pharmacyId: pharm.id,
        placedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.medicine.count({ where: { pharmacyId: pharm.id, stock: { lte: 30 }, active: true } }),
    prisma.transaction.aggregate({
      _sum: { netPaisa: true, grossPaisa: true },
      where: { providerRole: "PHARMACY_ADMIN", providerId: pharm.id, status: "SUCCEEDED", capturedAt: { gte: startOfMonth } },
    }),
    prisma.pharmacyOrder.findMany({
      where: { pharmacyId: pharm.id },
      include: { patient: { include: { user: true } }, items: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const cols: Column<(typeof recent)[number]>[] = [
    { key: "id", header: "Order", cell: (r) => <span className="ge-mono text-[11.5px]">#{r.id.slice(-6).toUpperCase()}</span> },
    { key: "p", header: "Customer", cell: (r) => r.patient.user.name },
    { key: "items", header: "Items", cell: (r) => r.items.length },
    { key: "total", header: "Total", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.totalPaisa)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={r.status as StatusKind} /> },
    { key: "when", header: "Placed", cell: (r) => formatDate(r.placedAt) },
  ];

  return (
    <AppShell
      navItems={PHARMACY_NAV}
      user={{ name: pharm.name, role: `${pharm.city.nameEn} · Pharmacy`, image: me.image }}
      title="Pharmacy operations"
      subtitle={`${todaysOrders} new orders today · ${lowStock} low-stock SKUs`}
      search="Search SKU, prescription, order…"
    >
      <div className="grid gap-3 md:grid-cols-4">
        <Kpi label="Today's orders" value={String(todaysOrders)} icon={Box} />
        <Kpi label="Total orders" value={totalOrders.toLocaleString()} icon={Truck} />
        <Kpi label="Low stock" value={String(lowStock)} icon={Bell} />
        <Kpi label="Revenue (mo.)" value={formatPkrCompact(monthRevenue._sum.grossPaisa ?? 0)} icon={Wallet} delta={`${formatPkrCompact(monthRevenue._sum.netPaisa ?? 0)} net`} deltaDir="up" />
      </div>
      <div className="mt-4">
        <Card className="p-0">
          <div className="px-5 py-4">
            <h2 className="text-[14px] font-semibold text-ge-ink">Active orders</h2>
            <p className="text-[11px] text-ge-muted">Verify prescriptions and pack on time.</p>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={Pill} title="No orders yet" body="Orders appear here as patients check out." />
          ) : (
            <DataTable columns={cols} rows={recent} rowKey={(r) => r.id} />
          )}
        </Card>
      </div>
    </AppShell>
  );
}
