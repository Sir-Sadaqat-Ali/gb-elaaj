import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { NURSE_NAV } from "@/app/(nurse)/nurse/_nav";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { formatDateTime, formatPkr } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Assignments" };

export default async function NurseAssignmentsPage() {
  const session = await requireRole("NURSE");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { nurseProfile: true } });
  if (!me?.nurseProfile) return null;

  const items = await prisma.homeCareRequest.findMany({
    where: { nurseId: me.nurseProfile.id },
    include: { patient: { include: { user: true } } },
    orderBy: { scheduledFor: "desc" },
  });

  const cols: Column<(typeof items)[number]>[] = [
    { key: "p", header: "Patient", cell: (r) => r.patient.user.name },
    { key: "svc", header: "Service", cell: (r) => r.serviceName },
    { key: "addr", header: "Address", cell: (r) => r.addressLine },
    { key: "when", header: "Scheduled", cell: (r) => formatDateTime(r.scheduledFor) },
    { key: "price", header: "Fee", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.pricePaisa)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={r.status as StatusKind} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) => (
        <Link
          href={`/nurse/assignments/${r.id}`}
          className="text-[12px] font-semibold text-ge-primary hover:underline"
        >
          Open →
        </Link>
      ),
    },
  ];

  return (
    <AppShell navItems={NURSE_NAV} user={{ name: me.name, role: "Nurse", image: me.image }} title="Assignments" subtitle={`${items.length} total assignments`}>
      <DataTable columns={cols} rows={items} rowKey={(r) => r.id} />
    </AppShell>
  );
}
