import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, FileText, Star, Video, X } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PATIENT_NAV } from "@/app/(patient)/patient/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { CancelAppointmentButton } from "@/components/booking/cancel-appointment-button";
import { RescheduleAppointment } from "@/components/booking/reschedule-appointment";
import { FileDownloadButton } from "@/components/uploads/file-download-button";
import { ConfirmButton } from "@/components/data/confirm-button";
import { deleteReviewAction } from "@/lib/actions/reviews";
import { formatDate, formatTime, formatPkr, formatDateTime } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export default async function PatientAppointmentDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ booked?: string }>;
}) {
  const session = await requireRole("PATIENT");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { patient: true } });
  if (!me?.patient) return null;

  const { id } = await params;
  const { booked } = await searchParams;

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: {
      doctor: { include: { user: true, specialties: { include: { specialty: true } }, city: true } },
      transaction: true,
      review: true,
      records: { orderBy: { recordedAt: "desc" } },
    },
  });
  if (!appt || appt.patientId !== me.patient.id) notFound();

  const canJoin =
    appt.mode === "VIDEO" &&
    appt.status === "CONFIRMED" &&
    appt.scheduledFor.getTime() - Date.now() < 10 * 60 * 1000 + 60 * 60 * 1000 &&
    Date.now() - appt.scheduledFor.getTime() < 60 * 60 * 1000;

  const cancellable = appt.status === "CONFIRMED" || appt.status === "PENDING";
  const review = appt.review;
  const reviewable = appt.status === "COMPLETED" && !review;
  const startsInMs = appt.scheduledFor.getTime() - Date.now();

  const openSlots = cancellable
    ? await prisma.doctorAvailability.findMany({
        where: { doctorId: appt.doctorId, status: "OPEN", startsAt: { gte: new Date() } },
        orderBy: { startsAt: "asc" },
        take: 24,
      })
    : [];

  return (
    <AppShell
      navItems={PATIENT_NAV}
      user={{ name: me.name, role: "Patient", image: me.image }}
      title="Appointment"
      subtitle={`${appt.doctor.user.name} · ${formatDateTime(appt.scheduledFor)}`}
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link href="/patient/appointments"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
        </Button>
      }
    >
      {booked === "1" && (
        <div className="mb-4 rounded-md border border-[color:var(--ge-success-border)] bg-[color:var(--ge-success-bg)] p-3 text-[13px] text-[color:var(--ge-success)]">
          Booking confirmed — a copy has been emailed to you.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-ge-ink">Details</h2>
              <StatusChip status={appt.status as StatusKind} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
              <KV label="Doctor" value={
                <div className="flex items-center gap-2">
                  <Avatar src={appt.doctor.user.image} name={appt.doctor.user.name} size={32} />
                  <span>{appt.doctor.user.name}</span>
                </div>
              } />
              <KV label="Specialty" value={appt.doctor.specialties[0]?.specialty.nameEn ?? "—"} />
              <KV label="Mode" value={appt.mode === "VIDEO" ? "Video" : "Clinic"} />
              <KV label="Duration" value={`${appt.durationMin} min`} />
              <KV label="Date" value={formatDate(appt.scheduledFor)} />
              <KV label="Time" value={formatTime(appt.scheduledFor)} />
              <KV label="Fee" value={<span className="ge-mono">{formatPkr(appt.feePaisa)}</span>} />
              <KV label="Booking ID" value={<span className="ge-mono">{appt.id.slice(-8).toUpperCase()}</span>} />
            </div>
            {appt.symptoms && (
              <div className="mt-4 rounded-md border border-ge-border bg-ge-soft-bg p-3">
                <div className="text-[11.5px] font-semibold uppercase tracking-wider text-ge-muted">Symptoms shared</div>
                <p className="mt-1 text-[13px] text-ge-ink">{appt.symptoms}</p>
              </div>
            )}
            {appt.cancelReason && (
              <div className="mt-4 rounded-md border border-[color:var(--ge-danger-border)] bg-[color:var(--ge-danger-bg)] p-3 text-[12.5px] text-[color:var(--ge-danger)]">
                <strong>Cancelled:</strong> {appt.cancelReason}
              </div>
            )}
          </Card>

          {appt.records.length > 0 && (
            <Card className="p-5">
              <h2 className="text-[14px] font-semibold text-ge-ink">From this consultation</h2>
              <ul className="mt-3 divide-y divide-ge-border">
                {appt.records.map((r) => (
                  <li key={r.id} className="flex items-start gap-3 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ge-soft-bg text-ge-primary">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-ge-ink">{r.title}</div>
                      <div className="text-[11px] text-ge-muted">
                        {r.type.replace("_", " ")} · {formatDate(r.recordedAt)}
                      </div>
                      {r.body && <p className="mt-1 text-[12.5px] text-ge-muted">{r.body}</p>}
                    </div>
                    {r.fileKey && <FileDownloadButton id={r.id} kind="medical-record" label="File" />}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {review && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-ge-ink">Your review</h2>
                <div className="flex items-center gap-0.5" role="img" aria-label={`${review.rating} out of 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-4 w-4 ${n <= review.rating ? "fill-current text-[color:var(--ge-warning)]" : "text-ge-border"}`}
                    />
                  ))}
                </div>
              </div>
              {review.text && <p className="mt-2 text-[13px] leading-relaxed text-ge-ink">{review.text}</p>}
              {review.reply && (
                <div className="mt-3 rounded-md border border-ge-border bg-ge-soft-bg p-3">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ge-muted">Doctor's reply</div>
                  <p className="mt-1 text-[12.5px] text-ge-ink">{review.reply}</p>
                </div>
              )}
              <div className="mt-4 flex items-center gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/patient/reviews/new/${appt.id}`}>Edit review</Link>
                </Button>
                <ConfirmButton
                  action={deleteReviewAction}
                  arg={{ appointmentId: appt.id }}
                  label="Delete"
                  variant="destructive-outline"
                  confirmText="Delete your review?"
                  successMsg="Review deleted."
                />
              </div>
            </Card>
          )}
        </div>

        <aside className="space-y-3">
          <Card className="p-5">
            <h3 className="text-[14px] font-semibold text-ge-ink">Actions</h3>
            <div className="mt-3 space-y-2">
              {canJoin && (
                <Button asChild className="w-full">
                  <Link href={`/patient/appointments/${appt.id}/video`}>
                    <Video className="h-4 w-4" /> Join video call
                  </Link>
                </Button>
              )}
              {appt.mode === "VIDEO" && appt.status === "CONFIRMED" && !canJoin && (
                <p className="text-[11.5px] text-ge-muted">
                  Join button activates 10 min before your appointment{" "}
                  ({startsInMs > 0 ? "starts in " : "started "}
                  {humanDelta(Math.abs(startsInMs))}).
                </p>
              )}
              {reviewable && (
                <Button asChild variant="secondary" className="w-full">
                  <Link href={`/patient/reviews/new/${appt.id}`}>
                    <Star className="h-4 w-4" /> Write a review
                  </Link>
                </Button>
              )}
              {cancellable && openSlots.length > 0 && (
                <RescheduleAppointment
                  appointmentId={appt.id}
                  slots={openSlots.map((s) => ({ id: s.id, startsAt: s.startsAt.toISOString(), mode: s.mode }))}
                />
              )}
              {cancellable && (
                <CancelAppointmentButton appointmentId={appt.id} />
              )}
            </div>
          </Card>

          {appt.transaction && (
            <Card className="p-5">
              <h3 className="text-[13.5px] font-semibold text-ge-ink">Payment</h3>
              <ul className="mt-2 space-y-1 text-[12.5px]">
                <KVRow k="Method" v={appt.transaction.provider ?? "—"} />
                <KVRow k="Status" v={<Badge variant={appt.transaction.status === "SUCCEEDED" ? "success" : appt.transaction.status === "REFUNDED" ? "neutral" : "warning"}>{appt.transaction.status}</Badge>} />
                <KVRow k="Amount" v={<span className="ge-mono">{formatPkr(appt.transaction.grossPaisa)}</span>} />
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ge-muted">{label}</div>
      <div className="mt-0.5 text-[13px] text-ge-ink">{value}</div>
    </div>
  );
}

function KVRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-ge-muted">{k}</span>
      <span className="font-medium text-ge-ink">{v}</span>
    </li>
  );
}

function humanDelta(ms: number) {
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  return `${h} hr`;
}
