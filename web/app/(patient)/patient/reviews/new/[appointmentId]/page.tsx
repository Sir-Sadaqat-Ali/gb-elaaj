import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PATIENT_NAV } from "@/app/(patient)/patient/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/components/booking/review-form";
import { formatDate } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Write a review" };

export default async function NewReviewPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const session = await requireRole("PATIENT");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { patient: true } });
  if (!me?.patient) return null;
  const { appointmentId } = await params;
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: { include: { user: true, specialties: { include: { specialty: true } } } }, review: true },
  });
  if (!appt || appt.patientId !== me.patient.id) notFound();

  const isEdit = !!appt.review;

  if (appt.status !== "COMPLETED" && !isEdit) {
    return (
      <AppShell navItems={PATIENT_NAV} user={{ name: me.name, role: "Patient", image: me.image }} title="Write a review" subtitle="—">
        <p className="text-[13px] text-ge-muted">Reviews are only allowed after the appointment completes.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      navItems={PATIENT_NAV}
      user={{ name: me.name, role: "Patient", image: me.image }}
      title={isEdit ? "Edit your review" : "Write a review"}
      subtitle={`Share your experience with ${appt.doctor.user.name}`}
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link href={`/patient/appointments/${appt.id}`}><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <Card className="p-6">
          <ReviewForm
            appointmentId={appt.id}
            mode={isEdit ? "edit" : "create"}
            initialRating={appt.review?.rating ?? 5}
            initialText={appt.review?.text ?? ""}
          />
        </Card>
        <Card className="p-5">
          <h3 className="text-[13px] font-semibold text-ge-ink">Doctor</h3>
          <div className="mt-3 flex items-center gap-2.5">
            <Avatar src={appt.doctor.user.image} name={appt.doctor.user.name} size={40} />
            <div>
              <div className="text-[13px] font-semibold text-ge-ink">{appt.doctor.user.name}</div>
              <div className="text-[11px] text-ge-primary">{appt.doctor.specialties[0]?.specialty.nameEn}</div>
              <div className="text-[10.5px] text-ge-muted">{formatDate(appt.scheduledFor)}</div>
            </div>
          </div>
          <p className="mt-4 text-[11.5px] leading-relaxed text-ge-muted">
            Reviews help future patients find the right doctor. Be specific, respectful, and avoid sharing private medical details.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
