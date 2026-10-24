import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_NAV } from "@/app/(admin)/admin/_nav";
import { Card } from "@/components/ui/card";
import { Kpi } from "@/components/data/kpi";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { formatPkr, formatPkrCompact, formatDateTime } from "@/lib/formatting";
import { TrendingUp, Wallet, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin · Finance" };

export default async function AdminFinancePage() {
  const session = await requireRole("ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [agg, recent, byKind] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { grossPaisa: true, commissionPaisa: true, netPaisa: true },
      where: { status: "SUCCEEDED", capturedAt: { gte: monthStart } },
    }),
    prisma.transaction.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.transaction.groupBy({
      by: ["kind"],
      _sum: { grossPaisa: true },
      where: { status: "SUCCEEDED", capturedAt: { gte: monthStart } },
    }),
  ]);

  const cols: Column<(typeof recent)[number]>[] = [
    { key: "id", header: "Txn", cell: (r) => <span className="ge-mono text-[11.5px]">{r.id.slice(-8).toUpperCase()}</span> },
    { key: "kind", header: "Type", cell: (r) => r.kind },
    { key: "gross", header: "Gross", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.grossPaisa)}</span> },
    { key: "comm", header: "Commission", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.commissionPaisa)}</span> },
    { key: "net", header: "Net", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.netPaisa)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={(r.status === "SUCCEEDED" ? "PAID" : r.status === "PENDING" ? "PENDING" : "REFUNDED") as StatusKind} /> },
    { key: "when", header: "Date", cell: (r) => <span className="text-[11.5px] text-ge-muted">{formatDateTime(r.createdAt)}</span> },
  ];

  return (
    <AppShell navItems={ADMIN_NAV} user={{ name: me.name, role: "Super Admin", image: me.image }} title="Finance" subtitle={`Month-to-date · revenue & commission`}>
      <div className="grid gap-3 md:grid-cols-3">
        <Kpi label="Gross revenue (mo.)" value={formatPkrCompact(agg._sum.grossPaisa ?? 0)} icon={TrendingUp} />
        <Kpi label="Platform commission" value={formatPkrCompact(agg._sum.commissionPaisa ?? 0)} icon={Wallet} />
        <Kpi label="Provider earnings" value={formatPkrCompact(agg._sum.netPaisa ?? 0)} icon={Users} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_2fr]">
        <Card className="p-5">
          <h2 className="text-[13.5px] font-semibold text-ge-ink">Revenue by service</h2>
          <ul className="mt-3 space-y-3">
            {byKind.map((b) => (
              <li key={b.kind}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-ge-ink">{b.kind.replaceAll("_", " ")}</span>
                  <span className="ge-mono font-medium">{formatPkrCompact(b._sum.grossPaisa ?? 0)}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ge-soft-bg">
                  <div className="h-full bg-ge-primary" style={{ width: `${Math.min(100, ((b._sum.grossPaisa ?? 0) / Math.max(1, agg._sum.grossPaisa ?? 1)) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-0">
          <div className="px-5 py-4">
            <h2 className="text-[13.5px] font-semibold text-ge-ink">All transactions</h2>
          </div>
          <DataTable columns={cols} rows={recent} rowKey={(r) => r.id} />
        </Card>
      </div>
    </AppShell>
  );
}
