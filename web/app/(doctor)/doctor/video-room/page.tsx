import Link from "next/link";
import { Building, Video } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { DOCTOR_NAV } from "@/app/(doctor)/doctor/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/data/empty-state";
import { formatDate, formatTime } from "@/lib/formatting";

export const metadata = { title: "Video room" };
export const dynamic = "force-dynamic";

export default async function DoctorVideoRoomLandingPage() {
  const session = await requireRole("DOCTOR");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { doctor: true },
  });
  if (!me?.doctor) return null;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [upcoming, recent] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId: me.doctor.id,
        mode: "VIDEO",
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        scheduledFor: { gte: oneDayAgo },
      },
      include: { patient: { include: { user: true } } },
      orderBy: { scheduledFor: "asc" },
      take: 20,
    }),
    prisma.appointment.findMany({
      where: { doctorId: me.doctor.id, mode: "VIDEO", status: "COMPLETED" },
      include: { patient: { include: { user: true } } },
      orderBy: { scheduledFor: "desc" },
      take: 8,
    }),
  ]);

  return (
    <AppShell
      navItems={DOCTOR_NAV}
      user={{ name: me.name, role: "Doctor", image: me.image }}
      title="Video room"
      subtitle="Join an upcoming consultation or review a recent one."
    >
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <h2 className="text-[14px] font-semibold text-ge-ink">Upcoming video calls</h2>
          {upcoming.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={Video}
                title="No upcoming video calls"
                body="Once a patient books a video appointment with you, it will appear here with a Join button."
              />
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-ge-border">
              {upcoming.map((a) => {
                const ms = a.scheduledFor.getTime() - Date.now();
                const canJoin = (ms < 10 * 60 * 1000 && ms > -60 * 60 * 1000) || a.status === "IN_PROGRESS";
                return (
                  <li key={a.id} className="flex items-center gap-3 py-3">
                    <Avatar src={a.patient.user.image} name={a.patient.user.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-ge-ink">{a.patient.user.name}</div>
                      <div className="text-[11px] text-ge-muted">
                        {formatDate(a.scheduledFor)} · {formatTime(a.scheduledFor)} · {a.durationMin} min
                      </div>
                    </div>
                    <StatusChip status={a.status as StatusKind} />
                    {canJoin ? (
                      <Button asChild size="sm">
                        <Link href={`/doctor/video-room/${a.id}`}>
                          <Video className="h-3.5 w-3.5" /> Join
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled
                        aria-disabled="true"
                        title="Available 10 minutes before scheduled start"
                      >
                        <Video className="h-3.5 w-3.5" /> Not yet
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-[13.5px] font-semibold text-ge-ink">Recent video consultations</h3>
            {recent.length === 0 ? (
              <p className="mt-2 text-[12px] text-ge-muted">No completed video calls yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-ge-border">
                {recent.map((a) => (
                  <li key={a.id} className="flex items-center gap-2.5 py-2">
                    <Avatar src={a.patient.user.image} name={a.patient.user.name} size={26} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-medium text-ge-ink">{a.patient.user.name}</div>
                      <div className="text-[10.5px] text-ge-muted">{formatDate(a.scheduledFor)}</div>
                    </div>
                    <Link
                      href={`/doctor/video-room/${a.id}`}
                      className="text-[11px] font-medium text-ge-primary hover:underline"
                    >
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <Badge variant="info" className="gap-1">
              <Video className="h-3 w-3" /> How it works
            </Badge>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ge-muted">
              Each video appointment has a unique secure room. Join up to 10 minutes before the
              scheduled start. Call duration is logged.
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ge-muted">
              For in-person visits, manage them under{" "}
              <Link href="/doctor/appointments" className="text-ge-primary hover:underline">
                <Building className="inline h-3 w-3" /> Appointments
              </Link>.
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
