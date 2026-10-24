import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { FINANCE_NAV } from "@/app/(finance)/finance/_nav";
import { Card } from "@/components/ui/card";
import { Kpi } from "@/components/data/kpi";
import { TrendingUp, Wallet, Users, CreditCard } from "lucide-react";
import { formatPkrCompact } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Finance · Overview" };

export default async function FinanceDashboardPage() {
  const session = await requireRole("FINANCE");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [agg, byKind, pendingWd] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { grossPaisa: true, commissionPaisa: true, netPaisa: true },
      where: { status: "SUCCEEDED", capturedAt: { gte: monthStart } },
    }),
    prisma.transaction.groupBy({
      by: ["kind"],
      _sum: { grossPaisa: true },
      where: { status: "SUCCEEDED", capturedAt: { gte: monthStart } },
    }),
    prisma.withdrawal.aggregate({
      _sum: { amountPaisa: true },
      _count: true,
      where: { status: "REQUESTED" },
    }),
  ]);

  return (
    <AppShell navItems={FINANCE_NAV} user={{ name: me.name, role: "Finance Lead", image: me.image }} title="Finance overview" subtitle="Month-to-date · live ledger.">
      <div className="grid gap-3 md:grid-cols-4">
        <Kpi label="Gross revenue (mo.)" value={formatPkrCompact(agg._sum.grossPaisa ?? 0)} icon={TrendingUp} />
        <Kpi label="Platform commission" value={formatPkrCompact(agg._sum.commissionPaisa ?? 0)} icon={Wallet} />
        <Kpi label="Provider earnings" value={formatPkrCompact(agg._sum.netPaisa ?? 0)} icon={Users} />
        <Kpi label="Pending withdrawals" value={formatPkrCompact(pendingWd._sum.amountPaisa ?? 0)} icon={CreditCard} delta={`${pendingWd._count} requests`} deltaDir="flat" />
      </div>

      <div className="mt-4">
        <Card className="p-5">
          <h2 className="text-[14px] font-semibold text-ge-ink">Revenue by service · this month</h2>
          <ul className="mt-3 space-y-3">
            {byKind.map((b) => (
              <li key={b.kind}>
                <div className="flex items-center justify-between text-[12.5px]">
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
      </div>
    </AppShell>
  );
}
