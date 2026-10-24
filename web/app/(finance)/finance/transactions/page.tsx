import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { FINANCE_NAV } from "@/app/(finance)/finance/_nav";
import { ExportButton } from "@/components/data/export-button";
import { ConfirmButton } from "@/components/data/confirm-button";
import { refundTransactionAction } from "@/lib/actions/finance";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { formatPkr, formatDateTime } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Finance · Transactions" };

export default async function FinanceTransactionsPage() {
  const session = await requireRole("FINANCE");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  const txns = await prisma.transaction.findMany({
    include: { payer: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const cols: Column<(typeof txns)[number]>[] = [
    { key: "id", header: "Txn", cell: (r) => <span className="ge-mono text-[11.5px]">{r.id.slice(-8).toUpperCase()}</span> },
    { key: "kind", header: "Type", cell: (r) => r.kind },
    { key: "user", header: "User", cell: (r) => r.payer?.name ?? "—" },
    { key: "gross", header: "Gross", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.grossPaisa)}</span> },
    { key: "comm", header: "Commission", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.commissionPaisa)}</span> },
    { key: "net", header: "Net", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.netPaisa)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={(r.status === "SUCCEEDED" ? "PAID" : r.status === "PENDING" ? "PENDING" : r.status === "REFUNDED" ? "REFUNDED" : "REJECTED") as StatusKind} /> },
    { key: "when", header: "Date", cell: (r) => <span className="text-[11.5px] text-ge-muted">{formatDateTime(r.createdAt)}</span> },
    {
      key: "refund", header: "", align: "right", cell: (r) =>
        r.status === "SUCCEEDED" ? (
          <ConfirmButton
            action={refundTransactionAction}
            arg={{ transactionId: r.id }}
            label="Refund"
            variant="destructive-outline"
            confirmText={`Refund ${formatPkr(r.grossPaisa)}?`}
            successMsg="Payment refunded."
            className="h-7 px-2.5 text-[11px]"
          />
        ) : null,
    },
  ];

  return (
    <AppShell navItems={FINANCE_NAV} user={{ name: me.name, role: "Finance Lead", image: me.image }} title="Transactions" subtitle={`${txns.length} most recent`} actions={<ExportButton type="transactions" />}>
      <DataTable columns={cols} rows={txns} rowKey={(r) => r.id} />
    </AppShell>
  );
}
