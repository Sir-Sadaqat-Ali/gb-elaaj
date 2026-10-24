import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { DOCTOR_NAV } from "@/app/(doctor)/doctor/_nav";
import { DataTable, type Column } from "@/components/data/data-table";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/data/empty-state";
import { ChevronRight, Users } from "lucide-react";
import { formatDate } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Patients" };

export default async function DoctorPatientsPage() {
  const session = await requireRole("DOCTOR");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { doctor: true } });
  if (!me?.doctor) return null;

  const appts = await prisma.appointment.findMany({
    where: { doctorId: me.doctor.id },
    include: { patient: { include: { user: true } } },
  });
  const seen = new Map<string, { id: string; name: string; image: string | null; lastVisit: Date }>();
  for (const a of appts) {
    const cur = seen.get(a.patient.id);
    if (!cur || cur.lastVisit < a.scheduledFor) {
      seen.set(a.patient.id, { id: a.patient.id, name: a.patient.user.name, image: a.patient.user.image, lastVisit: a.scheduledFor });
    }
  }
  const rows = Array.from(seen.values()).sort((a, b) => b.lastVisit.getTime() - a.lastVisit.getTime());

  const cols: Column<(typeof rows)[number]>[] = [
    {
      key: "patient", header: "Patient", cell: (r) => (
        <Link href={`/doctor/patients/${r.id}`} className="flex items-center gap-2.5 hover:text-ge-primary">
          <Avatar src={r.image} name={r.name} size={32} />
          <span className="text-[12.5px] font-medium">{r.name}</span>
        </Link>
      ),
    },
    { key: "last", header: "Last visit", cell: (r) => <span className="text-[12.5px]">{formatDate(r.lastVisit)}</span> },
    {
      key: "view", header: "", cell: (r) => (
        <Link href={`/doctor/patients/${r.id}`} className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-ge-primary hover:underline">
          History <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ),
    },
  ];

  return (
    <AppShell navItems={DOCTOR_NAV} user={{ name: me.name, role: "Doctor", image: me.image }} title="Patients" subtitle="Patients you've consulted with.">
      {rows.length === 0 ? (
        <EmptyState icon={Users} title="No patients yet" body="As you complete consultations, patients appear here." />
      ) : (
        <DataTable columns={cols} rows={rows} rowKey={(r) => r.id} caption={`${rows.length} unique patients`} />
      )}
    </AppShell>
  );
}
