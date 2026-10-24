import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { DOCTOR_NAV } from "@/app/(doctor)/doctor/_nav";
import { Card } from "@/components/ui/card";
import { Kpi } from "@/components/data/kpi";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { Wallet, TrendingUp } from "lucide-react";
import { formatPkr, formatPkrCompact, formatDateTime } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Earnings" };

export default async function DoctorEarningsPage() {
  const session = await requireRole("DOCTOR");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { doctor: true } });
  if (!me?.doctor) return null;

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [txns, monthAgg, lifetimeAgg] = await Promise.all([
    prisma.transaction.findMany({
      where: { providerRole: "DOCTOR", providerId: me.doctor.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.transaction.aggregate({
      _sum: { netPaisa: true, commissionPaisa: true, grossPaisa: true },
      where: { providerRole: "DOCTOR", providerId: me.doctor.id, status: "SUCCEEDED", capturedAt: { gte: monthStart } },
    }),
    prisma.transaction.aggregate({
      _sum: { netPaisa: true },
      where: { providerRole: "DOCTOR", providerId: me.doctor.id, status: "SUCCEEDED" },
    }),
  ]);

  const cols: Column<(typeof txns)[number]>[] = [
    { key: "id", header: "Txn ID", cell: (r) => <span className="ge-mono text-[11.5px]">{r.id.slice(-8).toUpperCase()}</span> },
    { key: "kind", header: "Type", cell: (r) => r.kind },
    { key: "gross", header: "Gross", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.grossPaisa)}</span> },
    { key: "comm", header: "Commission", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.commissionPaisa)}</span> },
    { key: "net", header: "Net", align: "right", cell: (r) => <span className="ge-mono font-semibold">{formatPkr(r.netPaisa)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={(r.status === "SUCCEEDED" ? "PAID" : r.status) as StatusKind} /> },
    { key: "when", header: "Date", cell: (r) => <span className="text-[11.5px]">{formatDateTime(r.createdAt)}</span> },
  ];

  return (
    <AppShell navItems={DOCTOR_NAV} user={{ name: me.name, role: "Doctor", image: me.image }} title="Earnings" subtitle="Transaction history and lifetime totals.">
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="This month" value={formatPkrCompact(monthAgg._sum.netPaisa ?? 0)} icon={Wallet} />
        <Kpi label="This month commission" value={formatPkrCompact(monthAgg._sum.commissionPaisa ?? 0)} icon={TrendingUp} />
        <Kpi label="Lifetime net" value={formatPkrCompact(lifetimeAgg._sum.netPaisa ?? 0)} icon={Wallet} />
      </div>
      <div className="mt-4">
        <Card className="p-0">
          <div className="px-5 py-4">
            <h2 className="text-[14px] font-semibold text-ge-ink">Recent transactions</h2>
            <p className="text-[11px] text-ge-muted">Net amounts after platform commission.</p>
          </div>
          <DataTable columns={cols} rows={txns} rowKey={(r) => r.id} empty={<div className="p-8 text-center text-sm text-ge-muted">No transactions yet.</div>} />
        </Card>
      </div>
    </AppShell>
  );
}
