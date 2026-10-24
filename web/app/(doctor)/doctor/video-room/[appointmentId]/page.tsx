import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { DOCTOR_NAV } from "@/app/(doctor)/doctor/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VideoRoom } from "@/components/video/video-room";
import { formatDateTime } from "@/lib/formatting";

export const metadata = { title: "Video room" };
export const dynamic = "force-dynamic";

export default async function DoctorAppointmentVideoPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const session = await requireRole("DOCTOR");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { doctor: true } });
  if (!me?.doctor) return null;
  const { appointmentId } = await params;
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: { include: { user: true } } },
  });
  if (!appt || appt.doctorId !== me.doctor.id) notFound();

  return (
    <AppShell
      navItems={DOCTOR_NAV}
      user={{ name: me.name, role: "Doctor", image: me.image }}
      title="Video room"
      subtitle={`With ${appt.patient.user.name} · ${formatDateTime(appt.scheduledFor)}`}
    >
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card className="p-4">
          <VideoRoom
            appointmentId={appt.id}
            fallbackPeerName={appt.patient.user.name}
            fallbackPeerImage={appt.patient.user.image}
          />
          <p className="mt-3 text-[11.5px] text-ge-muted">
            Secure room scoped to this appointment. Patient consent and join logs are recorded for compliance.
          </p>
        </Card>

        <Card className="p-5">
          <h3 className="text-[13.5px] font-semibold text-ge-ink">Patient</h3>
          <div className="mt-3 flex items-center gap-2.5">
            <Avatar src={appt.patient.user.image} name={appt.patient.user.name} size={36} />
            <div>
              <div className="text-[13px] font-semibold text-ge-ink">{appt.patient.user.name}</div>
              <div className="text-[11px] text-ge-muted">{appt.patient.user.phone ?? appt.patient.user.email ?? "—"}</div>
            </div>
          </div>
          {appt.symptoms && (
            <>
              <div className="mt-4 text-[11.5px] font-semibold uppercase tracking-wider text-ge-muted">Symptoms shared</div>
              <p className="mt-1 text-[12.5px] text-ge-ink">{appt.symptoms}</p>
            </>
          )}
          <div className="mt-4 flex flex-col gap-2">
            <Button asChild size="sm">
              <Link href={`/doctor/prescriptions/new/${appt.id}`}>Write prescription</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/doctor/appointments">Back to today</Link>
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
