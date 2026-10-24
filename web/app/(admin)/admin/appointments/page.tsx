import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_NAV } from "@/app/(admin)/admin/_nav";
import { ExportButton } from "@/components/data/export-button";
import { DataTable, type Column } from "@/components/data/data-table";
import { Avatar } from "@/components/ui/avatar";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { formatDateTime, formatPkr } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin · Appointments" };

export default async function AdminAppointmentsPage() {
  const session = await requireRole("ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  const appts = await prisma.appointment.findMany({
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true, specialties: { include: { specialty: true } } } },
    },
    orderBy: { scheduledFor: "desc" },
    take: 100,
  });

  const cols: Column<(typeof appts)[number]>[] = [
    {
      key: "p", header: "Patient", cell: (r) => (
        <div className="flex items-center gap-2.5"><Avatar src={r.patient.user.image} name={r.patient.user.name} size={28} /><span className="text-[12.5px]">{r.patient.user.name}</span></div>
      ),
    },
    {
      key: "d", header: "Doctor", cell: (r) => (
        <div className="flex items-center gap-2.5"><Avatar src={r.doctor.user.image} name={r.doctor.user.name} size={28} /><span className="text-[12.5px]">{r.doctor.user.name}</span></div>
      ),
    },
    { key: "spec", header: "Specialty", cell: (r) => r.doctor.specialties[0]?.specialty.nameEn ?? "—" },
    { key: "when", header: "Scheduled", cell: (r) => formatDateTime(r.scheduledFor) },
    { key: "fee", header: "Fee", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.feePaisa)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={r.status as StatusKind} /> },
  ];

  return (
    <AppShell navItems={ADMIN_NAV} user={{ name: me.name, role: "Super Admin", image: me.image }} title="Appointments" subtitle="All appointments across the platform" actions={<ExportButton type="appointments" />}>
      <DataTable columns={cols} rows={appts} rowKey={(r) => r.id} caption={`${appts.length} most recent`} />
    </AppShell>
  );
}
