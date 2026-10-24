import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PHARMACY_NAV } from "@/app/(pharmacy)/pharmacy-admin/_nav";
import { Kpi } from "@/components/data/kpi";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { Wallet, TrendingUp } from "lucide-react";
import { formatPkr, formatPkrCompact, formatDateTime } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pharmacy · Earnings" };

export default async function PharmacyEarningsPage() {
  const session = await requireRole("PHARMACY_ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { pharmacyAdmin: true } });
  if (!me?.pharmacyAdmin) return null;

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [txns, monthAgg, lifetimeAgg] = await Promise.all([
    prisma.transaction.findMany({ where: { providerRole: "PHARMACY_ADMIN", providerId: me.pharmacyAdmin.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.transaction.aggregate({
      _sum: { netPaisa: true, commissionPaisa: true, grossPaisa: true },
      where: { providerRole: "PHARMACY_ADMIN", providerId: me.pharmacyAdmin.id, status: "SUCCEEDED", capturedAt: { gte: monthStart } },
    }),
    prisma.transaction.aggregate({
      _sum: { netPaisa: true },
      where: { providerRole: "PHARMACY_ADMIN", providerId: me.pharmacyAdmin.id, status: "SUCCEEDED" },
    }),
  ]);

  const cols: Column<(typeof txns)[number]>[] = [
    { key: "id", header: "Txn", cell: (r) => <span className="ge-mono text-[11.5px]">{r.id.slice(-8).toUpperCase()}</span> },
    { key: "gross", header: "Gross", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.grossPaisa)}</span> },
    { key: "comm", header: "Commission", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.commissionPaisa)}</span> },
    { key: "net", header: "Net", align: "right", cell: (r) => <span className="ge-mono font-semibold">{formatPkr(r.netPaisa)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={(r.status === "SUCCEEDED" ? "PAID" : r.status === "PENDING" ? "PENDING" : "REFUNDED") as StatusKind} /> },
    { key: "when", header: "Date", cell: (r) => formatDateTime(r.createdAt) },
  ];

  return (
    <AppShell navItems={PHARMACY_NAV} user={{ name: me.name, role: `Pharmacy · ${me.pharmacyAdmin.name}`, image: me.image }} title="Earnings" subtitle="Net of platform commission.">
      <div className="grid gap-3 md:grid-cols-3">
        <Kpi label="This month" value={formatPkrCompact(monthAgg._sum.netPaisa ?? 0)} icon={Wallet} />
        <Kpi label="Commission (mo.)" value={formatPkrCompact(monthAgg._sum.commissionPaisa ?? 0)} icon={TrendingUp} />
        <Kpi label="Lifetime net" value={formatPkrCompact(lifetimeAgg._sum.netPaisa ?? 0)} icon={Wallet} />
      </div>
      <div className="mt-4">
        <Card className="p-0">
          <div className="px-5 py-4">
            <h2 className="text-[14px] font-semibold text-ge-ink">Recent transactions</h2>
          </div>
          <DataTable columns={cols} rows={txns} rowKey={(r) => r.id} />
        </Card>
      </div>
    </AppShell>
  );
}
