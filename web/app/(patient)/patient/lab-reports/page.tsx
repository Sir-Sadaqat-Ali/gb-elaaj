import { Beaker } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { PATIENT_NAV } from "@/app/(patient)/patient/_nav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/data/empty-state";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { FileDownloadButton } from "@/components/uploads/file-download-button";
import { ConfirmButton } from "@/components/data/confirm-button";
import { cancelLabBookingAction } from "@/lib/actions/labs";
import { formatDate } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Lab Reports" };

export default async function PatientLabReportsPage() {
  const session = await requireRole("PATIENT");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { patient: true } });
  if (!me?.patient) return null;

  const bookings = await prisma.labBooking.findMany({
    where: { patientId: me.patient.id },
    include: { lab: true, test: true, report: true },
    orderBy: { scheduledFor: "desc" },
  });

  return (
    <AppShell
      navItems={PATIENT_NAV}
      user={{ name: me.name, role: "Patient", image: me.image }}
      title="Lab reports"
      subtitle="All your test results in one place."
    >
      {bookings.length === 0 ? (
        <EmptyState
          icon={Beaker}
          title="No lab reports yet"
          body="Reports appear here when your lab uploads them."
        />
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="flex items-center gap-3 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ge-soft-bg text-ge-primary">
                <Beaker className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-ge-ink">{b.test.nameEn}</div>
                <div className="text-[11px] text-ge-muted">
                  {b.lab.name} · {formatDate(b.scheduledFor)} · {b.mode === "HOME" ? "Home collection" : "Walk-in"}
                </div>
              </div>
              {b.report?.abnormal && <Badge variant="warning">Abnormal</Badge>}
              {b.report?.fileKey && (
                <FileDownloadButton id={b.report.id} kind="lab-report" label="Report" />
              )}
              {b.status === "BOOKED" && (
                <ConfirmButton
                  action={cancelLabBookingAction}
                  arg={{ bookingId: b.id }}
                  label="Cancel"
                  variant="destructive-outline"
                  confirmText="Cancel booking?"
                  successMsg="Lab booking cancelled."
                />
              )}
              <StatusChip status={b.status as StatusKind} />
            </Card>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
