import Link from "next/link";
import { Calendar } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PATIENT_NAV } from "@/app/(patient)/patient/_nav";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/data/data-table";
import { EmptyState } from "@/components/data/empty-state";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { formatPkr, formatDateTime } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Appointments" };

type Row = {
  id: string;
  scheduledFor: Date;
  mode: "VIDEO" | "CLINIC";
  status: StatusKind;
  feePaisa: number;
  doctor: { name: string; image: string | null; specialty: string };
};

const FILTERS = [
  { key: "all", label: "All", statuses: null },
  { key: "upcoming", label: "Upcoming", statuses: ["CONFIRMED", "PENDING"] as const },
  { key: "completed", label: "Completed", statuses: ["COMPLETED"] as const },
  { key: "cancelled", label: "Cancelled", statuses: ["CANCELLED", "NO_SHOW"] as const },
];

export default async function PatientAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireRole("PATIENT");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { patient: true } });
  if (!me?.patient) return null;

  const { status } = await searchParams;
  const active = FILTERS.find((f) => f.key === status) ?? FILTERS[0];

  const items = await prisma.appointment.findMany({
    where: {
      patientId: me.patient.id,
      ...(active.statuses ? { status: { in: [...active.statuses] } } : {}),
    },
    include: {
      doctor: { include: { user: true, specialties: { include: { specialty: true } } } },
    },
    orderBy: { scheduledFor: "desc" },
  });

  const rows: Row[] = items.map((a) => ({
    id: a.id,
    scheduledFor: a.scheduledFor,
    mode: a.mode,
    status: a.status as StatusKind,
    feePaisa: a.feePaisa,
    doctor: {
      name: a.doctor.user.name,
      image: a.doctor.user.image,
      specialty: a.doctor.specialties[0]?.specialty.nameEn ?? "Specialist",
    },
  }));

  const columns: Column<Row>[] = [
    {
      key: "doctor",
      header: "Doctor",
      cell: (r) => (
        <Link href={`/patient/appointments/${r.id}`} className="flex items-center gap-2.5 hover:text-ge-primary">
          <Avatar src={r.doctor.image} name={r.doctor.name} size={32} />
          <div>
            <div className="text-[12.5px] font-semibold text-ge-ink">{r.doctor.name}</div>
            <div className="text-[11px] text-ge-muted">{r.doctor.specialty}</div>
          </div>
        </Link>
      ),
    },
    { key: "when", header: "Scheduled", cell: (r) => <span className="text-[12.5px]">{formatDateTime(r.scheduledFor)}</span> },
    { key: "mode", header: "Mode", cell: (r) => <span className="text-[12.5px]">{r.mode === "VIDEO" ? "Video" : "Clinic"}</span> },
    { key: "fee", header: "Fee", align: "right", cell: (r) => <span className="ge-mono text-[12.5px]">{formatPkr(r.feePaisa)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={r.status} /> },
  ];

  return (
    <AppShell
      navItems={PATIENT_NAV}
      user={{ name: me.name, role: "Patient", image: me.image }}
      title="My appointments"
      subtitle="Upcoming, past, and cancelled consultations."
      actions={<Button asChild size="sm"><Link href="/doctors">Book new</Link></Button>}
    >
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/patient/appointments" : `/patient/appointments?status=${f.key}`}
            className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition ${
              active.key === f.key
                ? "border-ge-navy bg-ge-navy text-white"
                : "border-ge-border bg-white text-ge-muted hover:border-ge-primary hover:text-ge-ink"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={active.key === "all" ? "No appointments yet" : `No ${active.label.toLowerCase()} appointments`}
          body={active.key === "all" ? "Book your first consultation with a verified doctor." : "Try another filter."}
          action={active.key === "all" ? <Button asChild><Link href="/doctors">Find a doctor</Link></Button> : undefined}
        />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} caption={`${rows.length} shown`} />
      )}
    </AppShell>
  );
}
