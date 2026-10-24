import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { DOCTOR_NAV } from "@/app/(doctor)/doctor/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { FileDownloadButton } from "@/components/uploads/file-download-button";
import { formatDate, formatDateTime, formatPkr } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Patient history" };

function ageFrom(dob: Date | null | undefined): string {
  if (!dob) return "—";
  const years = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return years >= 0 && years < 130 ? `${years} yrs` : "—";
}

export default async function DoctorPatientHistoryPage({ params }: { params: Promise<{ patientId: string }> }) {
  const session = await requireRole("DOCTOR");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { doctor: true } });
  if (!me?.doctor) return null;
  const { patientId } = await params;

  // RBAC: a doctor may only view patients they have actually treated.
  const treatedCount = await prisma.appointment.count({ where: { doctorId: me.doctor.id, patientId } });
  if (treatedCount === 0) notFound();

  const [patient, appointments, records] = await Promise.all([
    prisma.patientProfile.findUnique({ where: { id: patientId }, include: { user: true, city: true } }),
    prisma.appointment.findMany({
      where: { doctorId: me.doctor.id, patientId },
      orderBy: { scheduledFor: "desc" },
    }),
    // Only records this doctor authored or that belong to this doctor's appointments.
    prisma.medicalRecord.findMany({
      where: { patientId, OR: [{ doctorId: me.doctor.id }, { appointment: { doctorId: me.doctor.id } }] },
      orderBy: { recordedAt: "desc" },
    }),
  ]);
  if (!patient) notFound();

  const completed = appointments.filter((a) => a.status === "COMPLETED").length;

  return (
    <AppShell
      navItems={DOCTOR_NAV}
      user={{ name: me.name, role: "Doctor", image: me.image }}
      title={patient.user.name}
      subtitle={`${appointments.length} visit${appointments.length === 1 ? "" : "s"} with you · ${completed} completed`}
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link href="/doctor/patients"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Avatar src={patient.user.image} name={patient.user.name} size={48} />
              <div>
                <div className="text-[14px] font-semibold text-ge-ink">{patient.user.name}</div>
                <div className="text-[11px] text-ge-muted">{patient.city?.nameEn ?? "—"}</div>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-[12.5px]">
              <Demo label="Age" value={ageFrom(patient.dob)} />
              <Demo label="Gender" value={patient.gender ? patient.gender[0] + patient.gender.slice(1).toLowerCase() : "—"} />
              <Demo label="Blood type" value={patient.bloodType ?? "—"} />
              <Demo label="Phone" value={patient.user.phone ?? "—"} />
            </dl>
          </Card>
        </aside>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ge-ink">
              <CalendarDays className="h-4 w-4 text-ge-primary" /> Consultation history
            </h2>
            <ul className="mt-3 divide-y divide-ge-border">
              {appointments.map((a) => (
                <li key={a.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[13px] font-semibold text-ge-ink">
                      {formatDateTime(a.scheduledFor)}
                      <span className="ml-2 text-[11px] font-normal text-ge-muted">{a.mode === "VIDEO" ? "Video" : "Clinic"} · {a.durationMin} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="ge-mono text-[11.5px] text-ge-muted">{formatPkr(a.feePaisa)}</span>
                      <StatusChip status={a.status as StatusKind} />
                    </div>
                  </div>
                  {a.symptoms && <p className="mt-1 text-[12px] text-ge-muted"><span className="font-medium text-ge-ink">Symptoms:</span> {a.symptoms}</p>}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ge-ink">
              <FileText className="h-4 w-4 text-ge-primary" /> Records & prescriptions
            </h2>
            {records.length === 0 ? (
              <p className="mt-2 text-[12px] text-ge-muted">No records from your consultations yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-ge-border">
                {records.map((r) => (
                  <li key={r.id} className="flex items-start gap-3 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ge-soft-bg text-ge-primary">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-ge-ink">{r.title}</div>
                      <div className="text-[11px] text-ge-muted">{r.type.replace(/_/g, " ")} · {formatDate(r.recordedAt)}</div>
                      {r.body && <p className="mt-1 text-[12.5px] text-ge-muted">{r.body}</p>}
                    </div>
                    {r.fileKey && <FileDownloadButton id={r.id} kind="medical-record" label="File" />}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Demo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ge-muted">{label}</dt>
      <dd className="mt-0.5 text-[13px] text-ge-ink">{value}</dd>
    </div>
  );
}
