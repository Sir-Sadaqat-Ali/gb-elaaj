import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { DOCTOR_NAV } from "@/app/(doctor)/doctor/_nav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/data/confirm-button";
import { blockSlotAction } from "@/lib/actions/schedule";
import { ensureDoctorUpcomingSlots } from "@/lib/slots";
import { formatDate, formatTime } from "@/lib/formatting";
import { Video, Building, Lock, CheckCircle2, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Schedule" };

export default async function DoctorSchedulePage() {
  const session = await requireRole("DOCTOR");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { doctor: true },
  });
  if (!me?.doctor) return null;

  // Auto-generate rolling 7-day 10am-5pm slots (20-min intervals) if not yet populated
  const upcoming = await ensureDoctorUpcomingSlots(me.doctor.id, 7);

  const totalOpen = upcoming.filter((s) => s.status === "OPEN").length;
  const totalBlocked = upcoming.filter((s) => s.status === "BLOCKED").length;
  const totalBooked = upcoming.filter((s) => s.status === "BOOKED").length;

  // Group slots by date
  const byDay: Record<string, typeof upcoming> = {};
  for (const s of upcoming) {
    const k = formatDate(s.startsAt);
    (byDay[k] ??= []).push(s);
  }

  const todayStr = formatDate(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDate(tomorrow);

  return (
    <AppShell
      navItems={DOCTOR_NAV}
      user={{ name: me.name, role: "Doctor", image: me.image }}
      title="Schedule & Time Slots"
      subtitle="Standard 10:00 AM – 5:00 PM operating hours (20-min slots). You can Block or Active any slot with one tap."
    >
      <div className="space-y-6">
        {/* KPI strip */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[22px] font-bold text-ge-ink">{totalOpen}</div>
              <div className="text-[12px] text-ge-muted">Active / Bookable Slots</div>
            </div>
          </Card>

          <Card className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[22px] font-bold text-ge-ink">{totalBlocked}</div>
              <div className="text-[12px] text-ge-muted">Blocked By You</div>
            </div>
          </Card>

          <Card className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-ge-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[22px] font-bold text-ge-ink">{totalBooked}</div>
              <div className="text-[12px] text-ge-muted">Booked by Patients</div>
            </div>
          </Card>
        </div>

        {/* Info banner */}
        <div className="rounded-2xl border border-ge-border bg-white p-4 text-[13px] text-ge-muted">
          <span className="font-semibold text-ge-ink">Daily Operating Hours:</span> 10:00 AM to 5:00 PM in 20-minute slots. Dates roll forward automatically every day. Click <strong>Block</strong> on any slot when you are not available.
        </div>

        {/* Days & Slots */}
        <div className="space-y-5">
          {Object.entries(byDay).map(([day, list]) => {
            const isToday = day === todayStr;
            const isTomorrow = day === tomorrowStr;
            const dayLabel = isToday ? `Today (${day})` : isTomorrow ? `Tomorrow (${day})` : day;

            return (
              <Card key={day} className="rounded-3xl border border-ge-border bg-white p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ge-border pb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-ge-ink">{dayLabel}</h3>
                    {isToday && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-ge-muted">
                    {list.filter((s) => s.status === "OPEN").length} active · {list.filter((s) => s.status === "BLOCKED").length} blocked
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {list.map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between gap-2 rounded-2xl border p-3 transition ${
                        s.status === "OPEN"
                          ? "border-emerald-200 bg-emerald-50/40"
                          : s.status === "BLOCKED"
                          ? "border-neutral-200 bg-neutral-50/80 opacity-75"
                          : "border-blue-200 bg-blue-50/50"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[13px] text-ge-ink">
                            {formatTime(s.startsAt)}
                          </span>
                          <span className="text-[11px] text-ge-muted inline-flex items-center gap-0.5">
                            {s.mode === "VIDEO" ? (
                              <Video className="h-3 w-3 text-ge-primary" />
                            ) : (
                              <Building className="h-3 w-3 text-emerald-600" />
                            )}
                            {s.mode === "VIDEO" ? "Video" : "Clinic"}
                          </span>
                        </div>
                        <div className="mt-1">
                          <Badge
                            variant={
                              s.status === "BOOKED"
                                ? "info"
                                : s.status === "OPEN"
                                ? "success"
                                : "neutral"
                            }
                          >
                            {s.status === "OPEN" ? "Active" : s.status === "BLOCKED" ? "Blocked" : "Booked"}
                          </Badge>
                        </div>
                      </div>

                      {s.status !== "BOOKED" ? (
                        <ConfirmButton
                          action={blockSlotAction}
                          arg={{ slotId: s.id }}
                          label={s.status === "BLOCKED" ? "Active" : "Block"}
                          variant={s.status === "BLOCKED" ? "primary" : "ghost"}
                          successMsg={s.status === "BLOCKED" ? "Slot is now active." : "Slot blocked."}
                          className="h-7 px-3 text-[11.5px]"
                        />
                      ) : (
                        <span className="text-[11px] font-semibold text-ge-primary">Booked</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
