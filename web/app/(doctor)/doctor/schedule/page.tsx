import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { DOCTOR_NAV } from "@/app/(doctor)/doctor/_nav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/data/confirm-button";
import { blockSlotAction } from "@/lib/actions/schedule";
import { ensureDoctorDaySlots } from "@/lib/slots";
import { formatDate, formatTime, formatPktDateIso } from "@/lib/formatting";
import { Video, Building, Lock, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Schedule" };

export default async function DoctorSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await requireRole("DOCTOR");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { doctor: true },
  });
  if (!me?.doctor) return null;

  const { date: rawDate } = await searchParams;

  // Selected date or real-time today in Pakistan Time
  const todayIso = formatPktDateIso(new Date());
  const activeDateIso = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : todayIso;
  const [y, m, d] = activeDateIso.split("-").map(Number);
  const activeDate = new Date(Date.UTC(y, m - 1, d, 5, 0, 0, 0)); // 10 AM PKT

  // Ensure standard 10:00 AM – 5:00 PM (20-min) slots exist for this ONE day
  const slots = await ensureDoctorDaySlots(me.doctor.id, activeDateIso);

  const prevDate = new Date(Date.UTC(y, m - 1, d - 1, 5, 0, 0, 0));
  const prevDateStr = formatPktDateIso(prevDate);

  const nextDate = new Date(Date.UTC(y, m - 1, d + 1, 5, 0, 0, 0));
  const nextDateStr = formatPktDateIso(nextDate);

  const isToday = activeDateIso === todayIso;
  const dateHeading = isToday ? `Today · ${formatDate(activeDate)}` : formatDate(activeDate);

  const totalOpen = slots.filter((s) => s.status === "OPEN").length;
  const totalBlocked = slots.filter((s) => s.status === "BLOCKED").length;
  const totalBooked = slots.filter((s) => s.status === "BOOKED").length;

  return (
    <AppShell
      navItems={DOCTOR_NAV}
      user={{ name: me.name, role: "Doctor", image: me.image }}
      title="Daily Schedule"
      subtitle="Standard 10:00 AM – 5:00 PM operating hours (20-min intervals). Real-time daily view."
    >
      <div className="space-y-6">
        {/* Single Day Card */}
        <Card className="rounded-3xl border border-ge-border bg-white p-6 shadow-xs">
          {/* Header with Date Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ge-border pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-[18px] font-bold text-ge-ink">{dateHeading}</h2>
                {isToday && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    Live Today
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12.5px] text-ge-muted">
                10:00 AM to 5:00 PM (20-min slots) · {totalOpen} active, {totalBlocked} blocked, {totalBooked} booked
              </p>
            </div>

            {/* Date Switcher */}
            <div className="flex items-center gap-2">
              <Link
                href={`/doctor/schedule?date=${prevDateStr}`}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-ge-border bg-white px-3 text-[12px] font-medium text-ge-ink transition hover:bg-ge-soft-bg"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Link>

              {!isToday && (
                <Link
                  href="/doctor/schedule"
                  className="inline-flex h-9 items-center rounded-xl bg-ge-primary px-3 text-[12px] font-medium text-white transition hover:bg-ge-primary-2"
                >
                  Today
                </Link>
              )}

              <Link
                href={`/doctor/schedule?date=${nextDateStr}`}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-ge-border bg-white px-3 text-[12px] font-medium text-ge-ink transition hover:bg-ge-soft-bg"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Quick Summary Pill Bar */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[12px]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> {totalOpen} Active Slots
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-700 border border-neutral-300">
              <Lock className="h-3.5 w-3.5" /> {totalBlocked} Blocked
            </span>
            {totalBooked > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 font-medium text-ge-primary border border-blue-200">
                ● {totalBooked} Booked
              </span>
            )}
          </div>

          {/* 10:00 AM – 5:00 PM Slots Grid (Exactly 1 day) */}
          <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {slots.map((s) => (
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
      </div>
    </AppShell>
  );
}
