import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { DOCTOR_NAV } from "@/app/(doctor)/doctor/_nav";
import { Card } from "@/components/ui/card";
import { PrescriptionForm, type RxTemplateOption } from "@/components/booking/prescription-form";
import { ConsultationNoteForm } from "@/components/booking/consultation-note-form";
import { ConfirmButton } from "@/components/data/confirm-button";
import { deleteRxTemplateAction } from "@/lib/actions/rx-templates";
import { Avatar } from "@/components/ui/avatar";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Issue prescription" };

export default async function NewPrescriptionPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const session = await requireRole("DOCTOR");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { doctor: true } });
  if (!me?.doctor) return null;
  const { appointmentId } = await params;
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: { include: { user: true } } },
  });
  if (!appt || appt.doctorId !== me.doctor.id) notFound();

  const templateRows = await prisma.prescriptionTemplate
    .findMany({
      where: { doctorId: me.doctor.id },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => [] as Awaited<ReturnType<typeof prisma.prescriptionTemplate.findMany>>); // table may not be migrated yet
  const templates: RxTemplateOption[] = templateRows.map((t) => ({
    id: t.id,
    name: t.name,
    diagnosis: t.diagnosis,
    notes: t.notes,
    lines: t.lines as RxTemplateOption["lines"],
  }));

  return (
    <AppShell
      navItems={DOCTOR_NAV}
      user={{ name: me.name, role: "Doctor", image: me.image }}
      title="Write prescription"
      subtitle={`For ${appt.patient.user.name} · ${formatDateTime(appt.scheduledFor)}`}
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link href="/doctor/appointments"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <Card className="p-6">
          <PrescriptionForm appointmentId={appt.id} templates={templates} />
        </Card>
        <Card className="p-5">
          <h3 className="text-[13px] font-semibold text-ge-ink">Patient</h3>
          <div className="mt-3 flex items-center gap-2.5">
            <Avatar src={appt.patient.user.image} name={appt.patient.user.name} size={36} />
            <div>
              <div className="text-[13px] font-semibold text-ge-ink">{appt.patient.user.name}</div>
              <div className="text-[11px] text-ge-muted">{appt.patient.user.email ?? appt.patient.user.phone ?? "—"}</div>
            </div>
          </div>
          {appt.symptoms && (
            <>
              <div className="mt-4 text-[11.5px] font-semibold uppercase tracking-wider text-ge-muted">Symptoms shared</div>
              <p className="mt-1 text-[12.5px] text-ge-ink">{appt.symptoms}</p>
            </>
          )}
        </Card>
        <Card className="p-5 md:col-start-2">
          <h3 className="text-[13px] font-semibold text-ge-ink">Consultation note</h3>
          <p className="mt-1 text-[11.5px] text-ge-muted">A quick note without a full prescription — saved to the patient&apos;s records.</p>
          <div className="mt-3">
            <ConsultationNoteForm appointmentId={appt.id} />
          </div>
        </Card>
        {templates.length > 0 && (
          <Card className="p-5 md:col-start-2">
            <h3 className="text-[13px] font-semibold text-ge-ink">Your templates</h3>
            <ul className="mt-3 divide-y divide-ge-border">
              {templates.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-medium text-ge-ink">{t.name}</div>
                    <div className="truncate text-[11px] text-ge-muted">{t.diagnosis} · {t.lines.length} med{t.lines.length === 1 ? "" : "s"}</div>
                  </div>
                  <ConfirmButton
                    action={deleteRxTemplateAction}
                    arg={{ id: t.id }}
                    label="Delete"
                    variant="destructive-outline"
                    confirmText="Delete template?"
                    successMsg="Template deleted."
                    className="h-7 px-2 text-[11px]"
                  />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
