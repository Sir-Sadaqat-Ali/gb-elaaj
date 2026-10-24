import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { NURSE_NAV } from "@/app/(nurse)/nurse/_nav";
import { Card } from "@/components/ui/card";
import { Kpi } from "@/components/data/kpi";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { Wallet, TrendingUp } from "lucide-react";
import { formatPkr, formatPkrCompact, formatDateTime } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nurse · Earnings" };

export default async function NurseEarningsPage() {
  const session = await requireRole("NURSE");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { nurseProfile: true } });
  if (!me?.nurseProfile) return null;

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [txns, monthAgg] = await Promise.all([
    prisma.transaction.findMany({ where: { providerRole: "NURSE", providerId: me.nurseProfile.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.transaction.aggregate({
      _sum: { netPaisa: true, commissionPaisa: true, grossPaisa: true },
      where: { providerRole: "NURSE", providerId: me.nurseProfile.id, status: "SUCCEEDED", capturedAt: { gte: monthStart } },
    }),
  ]);

  const cols: Column<(typeof txns)[number]>[] = [
    { key: "id", header: "Txn", cell: (r) => <span className="ge-mono text-[11.5px]">{r.id.slice(-8).toUpperCase()}</span> },
    { key: "gross", header: "Gross", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.grossPaisa)}</span> },
    { key: "net", header: "Net", align: "right", cell: (r) => <span className="ge-mono font-semibold">{formatPkr(r.netPaisa)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={(r.status === "SUCCEEDED" ? "PAID" : r.status === "PENDING" ? "PENDING" : "REFUNDED") as StatusKind} /> },
    { key: "when", header: "Date", cell: (r) => formatDateTime(r.createdAt) },
  ];

  return (
    <AppShell navItems={NURSE_NAV} user={{ name: me.name, role: "Nurse", image: me.image }} title="Earnings" subtitle="Net of platform commission.">
      <div className="grid gap-3 md:grid-cols-3">
        <Kpi label="Net (mo.)" value={formatPkrCompact(monthAgg._sum.netPaisa ?? 0)} icon={Wallet} />
        <Kpi label="Commission (mo.)" value={formatPkrCompact(monthAgg._sum.commissionPaisa ?? 0)} icon={TrendingUp} />
        <Kpi label="Gross (mo.)" value={formatPkrCompact(monthAgg._sum.grossPaisa ?? 0)} icon={Wallet} />
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
