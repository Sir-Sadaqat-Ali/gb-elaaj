import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { DOCTOR_NAV } from "@/app/(doctor)/doctor/_nav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/data/confirm-button";
import { blockSlotAction } from "@/lib/actions/schedule";
import { formatDate, formatTime } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Time slots" };

export default async function DoctorTimeSlotsPage() {
  const session = await requireRole("DOCTOR");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { doctor: true } });
  if (!me?.doctor) return null;

  const slots = await prisma.doctorAvailability.findMany({
    where: { doctorId: me.doctor.id, startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: 60,
  });

  const byDay: Record<string, typeof slots> = {};
  for (const s of slots) {
    const k = formatDate(s.startsAt);
    (byDay[k] ??= []).push(s);
  }

  return (
    <AppShell navItems={DOCTOR_NAV} user={{ name: me.name, role: "Doctor", image: me.image }} title="Upcoming time slots" subtitle="Your bookable slots for the next 5 days.">
      <div className="space-y-4">
        {Object.entries(byDay).map(([day, list]) => (
          <Card key={day} className="p-5">
            <h3 className="text-[13.5px] font-semibold text-ge-ink">{day}</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              {list.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 rounded-xl border border-ge-border bg-white px-3 py-2 text-[12px]">
                  <div>
                    <div className="font-semibold text-ge-ink">{formatTime(s.startsAt)}</div>
                    <Badge variant={s.status === "BOOKED" ? "info" : s.status === "OPEN" ? "success" : "neutral"}>
                      {s.status.toLowerCase()}
                    </Badge>
                  </div>
                  {s.status !== "BOOKED" && (
                    <ConfirmButton
                      action={blockSlotAction}
                      arg={{ slotId: s.id }}
                      label={s.status === "BLOCKED" ? "Unblock" : "Block"}
                      variant={s.status === "BLOCKED" ? "secondary" : "ghost"}
                      successMsg={s.status === "BLOCKED" ? "Slot reopened." : "Slot blocked."}
                      className="h-7 px-2.5 text-[11px]"
                    />
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
