import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { FINANCE_NAV } from "@/app/(finance)/finance/_nav";
import { ExportButton } from "@/components/data/export-button";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/data/empty-state";
import { Wallet } from "lucide-react";
import { ROLE_LABEL } from "@/lib/rbac";
import { WithdrawalDecision } from "@/components/booking/withdrawal-decision";
import { formatPkr, formatDate } from "@/lib/formatting";

export const metadata = { title: "Withdrawal queue" };
export const dynamic = "force-dynamic";

export default async function FinanceWithdrawalsPage() {
  const session = await requireRole("FINANCE");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  const wds = await prisma.withdrawal.findMany({
    include: { provider: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const cols: Column<(typeof wds)[number]>[] = [
    {
      key: "p", header: "Provider", cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar src={r.provider.image} name={r.provider.name} size={28} />
          <div>
            <div className="text-[12.5px] font-medium">{r.provider.name}</div>
            <div className="text-[10.5px] text-ge-muted">{ROLE_LABEL[r.providerRole]}</div>
          </div>
        </div>
      ),
    },
    { key: "amt", header: "Amount", align: "right", cell: (r) => <span className="ge-mono font-semibold">{formatPkr(r.amountPaisa)}</span> },
    { key: "bank", header: "Bank", cell: (r) => <span className="text-[11.5px]">{r.bankName} ·{" "}****{r.accountNumber.slice(-4)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={r.status as StatusKind} /> },
    { key: "when", header: "Requested", cell: (r) => formatDate(r.createdAt) },
    {
      key: "actions", header: "Actions", align: "right", cell: (r) => (
        <WithdrawalDecision withdrawalId={r.id} status={r.status} />
      ),
    },
  ];

  return (
    <AppShell navItems={FINANCE_NAV} user={{ name: me.name, role: "Finance Lead", image: me.image }} title="Withdrawals" subtitle={`${wds.length} requests`} actions={<ExportButton type="withdrawals" />}>
      {wds.length === 0 ? (
        <EmptyState icon={Wallet} title="No withdrawal requests" body="Withdrawal requests from providers will appear here." />
      ) : (
        <DataTable columns={cols} rows={wds} rowKey={(r) => r.id} />
      )}
    </AppShell>
  );
}
