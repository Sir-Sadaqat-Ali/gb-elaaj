import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { DOCTOR_NAV } from "@/app/(doctor)/doctor/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/data/empty-state";
import { formatDate } from "@/lib/formatting";

type RxLine = { drug: string; strength?: string; frequency?: string; durationDays?: number; notes?: string };

export const metadata = { title: "Prescriptions" };
export const dynamic = "force-dynamic";

export default async function DoctorPrescriptionsPage() {
  const session = await requireRole("DOCTOR");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { doctor: true },
  });
  if (!me?.doctor) return null;

  const rx = await prisma.medicalRecord.findMany({
    where: { doctorId: me.doctor.id, type: "PRESCRIPTION" },
    include: {
      patient: { include: { user: true } },
      appointment: true,
    },
    orderBy: { recordedAt: "desc" },
    take: 100,
  });

  return (
    <AppShell
      navItems={DOCTOR_NAV}
      user={{ name: me.name, role: "Doctor", image: me.image }}
      title="Prescriptions"
      subtitle={`${rx.length} prescription${rx.length === 1 ? "" : "s"} issued`}
      actions={
        <Button asChild size="sm" variant="secondary">
          <Link href="/doctor/appointments">
            <Plus className="h-3.5 w-3.5" /> Write from appointment
          </Link>
        </Button>
      }
    >
      {rx.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No prescriptions yet"
          body="Open a confirmed or completed appointment and click the prescription icon to write one."
          action={
            <Button asChild>
              <Link href="/doctor/appointments">Go to appointments</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rx.map((r) => {
            const data = (r.data as { diagnosis?: string; lines?: RxLine[] } | null) ?? null;
            const lines = data?.lines ?? [];
            return (
              <Card key={r.id} className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ge-soft-bg text-ge-primary">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-ge-ink">
                      {data?.diagnosis ?? r.title}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Avatar src={r.patient.user.image} name={r.patient.user.name} size={20} />
                      <span className="text-[12px] text-ge-muted">{r.patient.user.name}</span>
                      <span className="text-[10.5px] text-ge-muted">· {formatDate(r.recordedAt)}</span>
                    </div>
                  </div>
                  {r.appointment && (
                    <Button asChild size="sm" variant="ghost" className="h-7 px-2">
                      <Link href={`/doctor/prescriptions/new/${r.appointment.id}`} aria-label="View appointment">
                        Edit
                      </Link>
                    </Button>
                  )}
                </div>
                {lines.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-ge-border pt-3">
                    {lines.slice(0, 3).map((ln, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 text-[12px]">
                        <span className="font-medium text-ge-ink">
                          {ln.drug}
                          {ln.strength ? (
                            <span className="ml-1 text-ge-muted">{ln.strength}</span>
                          ) : null}
                        </span>
                        <span className="text-[11px] text-ge-muted">
                          {ln.frequency ?? "—"}
                          {ln.durationDays ? ` · ${ln.durationDays}d` : ""}
                        </span>
                      </li>
                    ))}
                    {lines.length > 3 && (
                      <li className="text-[11px] text-ge-muted">+ {lines.length - 3} more</li>
                    )}
                  </ul>
                )}
                {r.body && (
                  <p className="mt-3 line-clamp-2 text-[12px] leading-relaxed text-ge-muted">
                    {r.body}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="info">PRESCRIPTION</Badge>
                  {r.appointment && (
                    <Link href={`/doctor/prescriptions/new/${r.appointment.id}`} className="text-[11px] text-ge-primary hover:underline">
                      View / re-issue
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
