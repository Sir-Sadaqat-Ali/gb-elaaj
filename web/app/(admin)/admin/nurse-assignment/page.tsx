import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_NAV } from "@/app/(admin)/admin/_nav";
import { DataTable, type Column } from "@/components/data/data-table";
import { Avatar } from "@/components/ui/avatar";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { AssignNurseControl } from "@/components/booking/assign-nurse-control";
import { formatDateTime, formatPkr } from "@/lib/formatting";

export const metadata = { title: "Nurse assignment" };
export const dynamic = "force-dynamic";

export default async function AdminNurseAssignmentPage() {
  const session = await requireRole("ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  const [requests, nurses] = await Promise.all([
    prisma.homeCareRequest.findMany({
      include: { patient: { include: { user: true } }, nurse: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.nurseProfile.findMany({
      where: { active: true },
      include: { user: true, city: true },
      orderBy: { ratingAvg: "desc" },
    }),
  ]);

  const nurseOpts = nurses.map((n) => ({
    id: n.id,
    name: n.user.name,
    city: n.city.nameEn,
    level: n.level,
  }));

  const cols: Column<(typeof requests)[number]>[] = [
    {
      key: "p", header: "Patient", cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar src={r.patient.user.image} name={r.patient.user.name} size={28} />
          <span className="text-[12.5px]">{r.patient.user.name}</span>
        </div>
      ),
    },
    { key: "svc", header: "Service", cell: (r) => r.serviceName },
    { key: "when", header: "Scheduled", cell: (r) => formatDateTime(r.scheduledFor) },
    { key: "fee", header: "Fee", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.pricePaisa)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={r.status as StatusKind} /> },
    {
      key: "assign", header: "Nurse", cell: (r) => (
        <AssignNurseControl requestId={r.id} currentNurseId={r.nurseId} nurses={nurseOpts} />
      ),
    },
  ];

  return (
    <AppShell navItems={ADMIN_NAV} user={{ name: me.name, role: "Super Admin", image: me.image }} title="Nurse assignment" subtitle="Match home-care requests to nurses.">
      <DataTable
        columns={cols}
        rows={requests}
        rowKey={(r) => r.id}
        empty={<p className="p-6 text-center text-sm text-ge-muted">No home care requests yet.</p>}
      />
    </AppShell>
  );
}
