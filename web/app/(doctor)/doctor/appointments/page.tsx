import Link from "next/link";
import { Calendar, FileText, Video } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { DOCTOR_NAV } from "@/app/(doctor)/doctor/_nav";
import { DataTable, type Column } from "@/components/data/data-table";
import { EmptyState } from "@/components/data/empty-state";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CompleteAppointmentButton } from "@/components/booking/complete-appointment-button";
import { ConfirmButton } from "@/components/data/confirm-button";
import { markNoShowAction, cancelAppointmentAction } from "@/lib/actions/appointments";
import { formatDateTime } from "@/lib/formatting";

export const metadata = { title: "Doctor · Appointments" };
export const dynamic = "force-dynamic";

export default async function DoctorAppointmentsPage() {
  const session = await requireRole("DOCTOR");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { doctor: true } });
  if (!me?.doctor) return null;

  const appts = await prisma.appointment.findMany({
    where: { doctorId: me.doctor.id },
    include: { patient: { include: { user: true } } },
    orderBy: { scheduledFor: "desc" },
  });

  const cols: Column<(typeof appts)[number]>[] = [
    {
      key: "patient", header: "Patient", cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar src={r.patient.user.image} name={r.patient.user.name} size={28} />
          <span className="text-[12.5px]">{r.patient.user.name}</span>
        </div>
      ),
    },
    { key: "when", header: "Scheduled", cell: (r) => <span className="text-[12.5px]">{formatDateTime(r.scheduledFor)}</span> },
    { key: "mode", header: "Mode", cell: (r) => <span className="text-[12.5px]">{r.mode}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={r.status as StatusKind} /> },
    {
      key: "actions", header: "Actions", align: "right", cell: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {r.status === "CONFIRMED" && r.mode === "VIDEO" && (
            <Button asChild size="sm" variant="ghost" className="h-7 px-2">
              <Link href={`/doctor/video-room/${r.id}`} aria-label="Join video"><Video className="h-3.5 w-3.5" /></Link>
            </Button>
          )}
          {(r.status === "CONFIRMED" || r.status === "COMPLETED") && (
            <Button asChild size="sm" variant="ghost" className="h-7 px-2">
              <Link href={`/doctor/prescriptions/new/${r.id}`} aria-label="Write prescription"><FileText className="h-3.5 w-3.5" /></Link>
            </Button>
          )}
          {r.status === "CONFIRMED" && (
            <>
              <CompleteAppointmentButton appointmentId={r.id} />
              <ConfirmButton
                action={markNoShowAction}
                arg={{ appointmentId: r.id }}
                label="No-show"
                variant="ghost"
                confirmText="Mark no-show?"
                successMsg="Marked no-show."
                className="h-7 px-2"
              />
              <ConfirmButton
                action={cancelAppointmentAction}
                arg={{ appointmentId: r.id }}
                label="Cancel"
                variant="destructive-outline"
                confirmText="Cancel this appointment?"
                successMsg="Appointment cancelled."
                className="h-7 px-2"
              />
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppShell navItems={DOCTOR_NAV} user={{ name: me.name, role: "Doctor", image: me.image }} title="Appointments" subtitle="All your booked, completed, and cancelled appointments.">
      {appts.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments yet" body="As patients book you, they appear here." />
      ) : (
        <DataTable columns={cols} rows={appts} rowKey={(r) => r.id} caption={`${appts.length} total`} />
      )}
    </AppShell>
  );
}
