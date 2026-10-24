import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PATIENT_NAV } from "@/app/(patient)/patient/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VideoRoom } from "@/components/video/video-room";
import { formatDateTime } from "@/lib/formatting";

export const metadata = { title: "Video consultation" };
export const dynamic = "force-dynamic";

export default async function PatientVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("PATIENT");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { patient: true } });
  if (!me?.patient) return null;
  const { id } = await params;
  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { doctor: { include: { user: true, specialties: { include: { specialty: true } } } } },
  });
  if (!appt || appt.patientId !== me.patient.id) notFound();

  return (
    <AppShell
      navItems={PATIENT_NAV}
      user={{ name: me.name, role: "Patient", image: me.image }}
      title="Video consultation"
      subtitle={`With ${appt.doctor.user.name} · ${formatDateTime(appt.scheduledFor)}`}
    >
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card className="p-4">
          <VideoRoom
            appointmentId={appt.id}
            fallbackPeerName={appt.doctor.user.name}
            fallbackPeerImage={appt.doctor.user.image}
          />
          <p className="mt-3 text-[11.5px] text-ge-muted">
            Secure end-to-end consultation room. Allow camera and microphone when prompted.
          </p>
        </Card>

        <Card className="p-5">
          <h3 className="text-[13.5px] font-semibold text-ge-ink">Doctor</h3>
          <div className="mt-3 flex items-center gap-2.5">
            <Avatar src={appt.doctor.user.image} name={appt.doctor.user.name} size={36} />
            <div>
              <div className="text-[13px] font-semibold text-ge-ink">{appt.doctor.user.name}</div>
              <div className="text-[11px] text-ge-muted">{appt.doctor.specialties[0]?.specialty.nameEn}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href={`/patient/appointments/${appt.id}`}>← Back to appointment</Link>
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
