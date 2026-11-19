import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { DOCTOR_NAV } from "@/app/(doctor)/doctor/_nav";
import { Card } from "@/components/ui/card";
import { ensureDoctorDaySlots, getDoctorShift, getShiftForHour, getPktHour } from "@/lib/slots";
import { formatDate, formatTime, formatPktDateIso } from "@/lib/formatting";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { DoctorScheduleManager, type ScheduleSlotItem } from "@/components/doctor/doctor-schedule-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Schedule & Shifts" };

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
  const [ty, tm, td] = todayIso.split("-").map(Number);

  // Generate next 7 days in PKT for quick navigation
  const daysList: { iso: string; dayName: string; dateFormatted: string; isToday: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(ty, tm - 1, td + i, 5, 0, 0, 0));
    const iso = formatPktDateIso(d);
    const dayName =
      i === 0
        ? "Today"
        : i === 1
        ? "Tomorrow"
        : new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", weekday: "short" }).format(d);
    const dateFormatted = new Intl.DateTimeFormat("en-PK", {
      timeZone: "Asia/Karachi",
      day: "numeric",
      month: "short",
    }).format(d);
    daysList.push({ iso, dayName, dateFormatted, isToday: i === 0 });
  }

  const activeDateIso = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : todayIso;
  const [y, m, d] = activeDateIso.split("-").map(Number);
  const activeDate = new Date(Date.UTC(y, m - 1, d, 5, 0, 0, 0)); // 10 AM PKT

  // Ensure standard 24-Hour (20-min) slots exist for this ONE day
  const dbSlots = await ensureDoctorDaySlots(me.doctor.id, activeDateIso);

  const prevDate = new Date(Date.UTC(y, m - 1, d - 1, 5, 0, 0, 0));
  const prevDateStr = formatPktDateIso(prevDate);

  const nextDate = new Date(Date.UTC(y, m - 1, d + 1, 5, 0, 0, 0));
  const nextDateStr = formatPktDateIso(nextDate);

  const isToday = activeDateIso === todayIso;
  const dateHeading = isToday ? `Today · ${formatDate(activeDate)}` : formatDate(activeDate);

  const assignedShift = getDoctorShift(me.doctor.id);

  // Map to slot items
  const scheduleSlots: ScheduleSlotItem[] = dbSlots.map((s) => {
    const pktH = getPktHour(new Date(s.startsAt));
    const shift = getShiftForHour(pktH);
    return {
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      mode: s.mode,
      status: s.status as "OPEN" | "BLOCKED" | "BOOKED",
      shift,
      timeLabel: formatTime(s.startsAt),
    };
  });

  const totalOpen = scheduleSlots.filter((s) => s.status === "OPEN").length;
  const totalBlocked = scheduleSlots.filter((s) => s.status === "BLOCKED").length;
  const totalBooked = scheduleSlots.filter((s) => s.status === "BOOKED").length;

  return (
    <AppShell
      navItems={DOCTOR_NAV}
      user={{ name: me.name, role: "Doctor", image: me.image }}
      title="Daily Schedule & Shift Rotation"
      subtitle="24-Hour coverage with 3 working shifts: Morning (صبح), Evening (شام), and Night (رات)."
    >
      <div className="space-y-6">
        {/* Day Card */}
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
                24-Hour Active Rotation · {totalOpen} active, {totalBlocked} disabled, {totalBooked} booked
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

          {/* 7-Day Quick Switcher Strip */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-ge-border pb-3">
            {daysList.map((d) => {
              const isActive = d.iso === activeDateIso;
              return (
                <Link
                  key={d.iso}
                  href={`/doctor/schedule?date=${d.iso}`}
                  className={`flex shrink-0 items-center justify-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-center text-[12px] font-semibold transition ${
                    isActive
                      ? "border-2 border-ge-primary bg-ge-primary text-white shadow-xs"
                      : "border border-ge-border bg-white text-ge-ink hover:border-ge-primary/50 hover:bg-ge-blue-tint/30"
                  }`}
                >
                  <span className={isActive ? "text-white/80" : "text-ge-muted"}>{d.dayName}</span>
                  <span>{d.dateFormatted}</span>
                </Link>
              );
            })}
          </div>

          {/* Doctor Schedule Manager (Shift Control Center + 3 Shift Cards + Filter Tabs + Editable Dabbe Dabbe) */}
          <div className="mt-6">
            <DoctorScheduleManager
              dateIso={activeDateIso}
              assignedShift={assignedShift}
              slots={scheduleSlots}
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
