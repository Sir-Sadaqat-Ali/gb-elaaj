import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { FINANCE_NAV } from "@/app/(finance)/finance/_nav";
import { Card } from "@/components/ui/card";
import { Kpi } from "@/components/data/kpi";
import { DataTable, type Column } from "@/components/data/data-table";
import { TrendingUp, Wallet, Users } from "lucide-react";
import { formatPkr, formatPkrCompact } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Commission reports" };

export default async function FinanceCommissionReportsPage() {
  const session = await requireRole("FINANCE");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [byKind, totals] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["kind"],
      _sum: { grossPaisa: true, commissionPaisa: true, netPaisa: true },
      _count: true,
      where: { status: "SUCCEEDED", capturedAt: { gte: monthStart } },
    }),
    prisma.transaction.aggregate({
      _sum: { grossPaisa: true, commissionPaisa: true, netPaisa: true },
      where: { status: "SUCCEEDED", capturedAt: { gte: monthStart } },
    }),
  ]);

  const cols: Column<(typeof byKind)[number]>[] = [
    { key: "kind", header: "Service", cell: (r) => <span className="font-medium">{r.kind.replaceAll("_", " ")}</span> },
    { key: "count", header: "Txns", align: "right", cell: (r) => r._count },
    { key: "gross", header: "Gross", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r._sum.grossPaisa ?? 0)}</span> },
    { key: "commission", header: "Commission", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r._sum.commissionPaisa ?? 0)}</span> },
    { key: "net", header: "Provider net", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r._sum.netPaisa ?? 0)}</span> },
    {
      key: "rate", header: "Effective rate", align: "right", cell: (r) => {
        const gross = r._sum.grossPaisa ?? 0;
        const comm = r._sum.commissionPaisa ?? 0;
        if (!gross) return "—";
        return `${((comm / gross) * 100).toFixed(1)}%`;
      },
    },
  ];

  return (
    <AppShell navItems={FINANCE_NAV} user={{ name: me.name, role: "Finance Lead", image: me.image }} title="Commission reports" subtitle="Month-to-date breakdown by service kind.">
      <div className="grid gap-3 md:grid-cols-3">
        <Kpi label="Gross (mo.)" value={formatPkrCompact(totals._sum.grossPaisa ?? 0)} icon={TrendingUp} />
        <Kpi label="Commission (mo.)" value={formatPkrCompact(totals._sum.commissionPaisa ?? 0)} icon={Wallet} />
        <Kpi label="Provider net (mo.)" value={formatPkrCompact(totals._sum.netPaisa ?? 0)} icon={Users} />
      </div>
      <div className="mt-4">
        <Card className="p-0">
          <div className="px-5 py-4">
            <h2 className="text-[14px] font-semibold text-ge-ink">By service</h2>
          </div>
          <DataTable columns={cols} rows={byKind} rowKey={(r) => r.kind} />
        </Card>
      </div>
    </AppShell>
  );
}
