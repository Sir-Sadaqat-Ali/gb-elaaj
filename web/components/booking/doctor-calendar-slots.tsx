"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Sun, Moon, Sunset, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ShiftCategory = "MORNING" | "EVENING" | "NIGHT";

export type SlotPill = {
  startsAt: string;
  timeLabel: string;
  isPast: boolean;
  isBooked: boolean;
  isBlocked: boolean;
  isOpen: boolean;
  slotId: string | null;
  shift: ShiftCategory;
};

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const SHIFT_CONFIG = {
  ALL: {
    key: "ALL",
    labelEn: "All Shifts",
    labelUr: "تمام شفٹیں",
    emoji: "⚡",
    timeRange: "24 Hours Coverage",
  },
  MORNING: {
    key: "MORNING",
    labelEn: "Morning",
    labelUr: "صبح",
    emoji: "🌅",
    timeRange: "08:00 AM – 04:00 PM",
  },
  EVENING: {
    key: "EVENING",
    labelEn: "Evening",
    labelUr: "شام",
    emoji: "🌆",
    timeRange: "04:00 PM – 12:00 AM",
  },
  NIGHT: {
    key: "NIGHT",
    labelEn: "Night",
    labelUr: "رات",
    emoji: "🌙",
    timeRange: "12:00 AM – 08:00 AM",
  },
} as const;

export function DoctorCalendarSlots({
  doctorSlug,
  todayIso,
  activeDateIso,
  slotPills,
  doctorShift,
}: {
  doctorSlug: string;
  todayIso: string;
  activeDateIso: string;
  slotPills: SlotPill[];
  doctorShift?: ShiftCategory;
}) {
  const router = useRouter();
  const [ay, am, ad] = activeDateIso.split("-").map(Number);
  const [viewYear, setViewYear] = React.useState(ay);
  const [viewMonth, setViewMonth] = React.useState(am - 1); // 0-indexed
  const [selectedShift, setSelectedShift] = React.useState<"ALL" | ShiftCategory>("ALL");

  // Format selected date nicely
  const selectedDateObj = new Date(Date.UTC(ay, am - 1, ad, 5, 0, 0, 0));
  const selectedDateLabel = new Intl.DateTimeFormat("en-PK", {
    timeZone: "Asia/Karachi",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(selectedDateObj);

  // Month calculations
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleSelectDate(dateStr: string) {
    if (dateStr < todayIso) return;
    router.push(`/doctor/${doctorSlug}?date=${dateStr}#slots`);
  }

  // Shift counts
  const morningSlots = slotPills.filter((s) => s.shift === "MORNING");
  const eveningSlots = slotPills.filter((s) => s.shift === "EVENING");
  const nightSlots = slotPills.filter((s) => s.shift === "NIGHT");

  const openMorningCount = morningSlots.filter((s) => s.isOpen).length;
  const openEveningCount = eveningSlots.filter((s) => s.isOpen).length;
  const openNightCount = nightSlots.filter((s) => s.isOpen).length;
  const openTotalCount = slotPills.filter((s) => s.isOpen).length;

  const activeShiftBadge = React.useMemo(() => {
    if (openTotalCount === 0) {
      return { label: "Day Off (چھٹی)", color: "bg-amber-100 text-amber-900 border-amber-300" };
    }
    if (openMorningCount > 0 && openEveningCount === 0 && openNightCount === 0) {
      return { label: "Active Shift: 🌅 Morning (صبح)", color: "bg-amber-100 text-amber-900 border-amber-300" };
    }
    if (openEveningCount > 0 && openMorningCount === 0 && openNightCount === 0) {
      return { label: "Active Shift: 🌆 Evening (شام)", color: "bg-indigo-100 text-indigo-900 border-indigo-300" };
    }
    if (openNightCount > 0 && openMorningCount === 0 && openEveningCount === 0) {
      return { label: "Active Shift: 🌙 Night (رات)", color: "bg-purple-100 text-purple-900 border-purple-300" };
    }
    return { label: "⚡ 24-Hour Active (تمام شفٹیں ایکٹیو)", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
  }, [openTotalCount, openMorningCount, openEveningCount, openNightCount]);

  const filteredSlots =
    selectedShift === "ALL"
      ? slotPills
      : slotPills.filter((s) => s.shift === selectedShift);

  return (
    <div className="w-full min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ge-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-bold text-ge-ink">24-Hour Availability Calendar</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              24/7 Coverage
            </span>
          </div>
          <p className="mt-1 text-[12.5px] text-ge-muted">
            Round-the-clock doctor care divided into 3 shifts: Morning (صبح), Evening (شام), and Night (رات).
          </p>
        </div>

        {/* Native Date Picker Shortcut */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 rounded-xl border border-ge-border bg-white px-3 py-1.5 text-[12px] font-medium text-ge-ink hover:border-ge-primary cursor-pointer shadow-2xs">
            <CalendarIcon className="h-3.5 w-3.5 text-ge-primary" />
            <span>Pick Date:</span>
            <input
              type="date"
              min={todayIso}
              value={activeDateIso}
              onChange={(e) => {
                if (e.target.value) handleSelectDate(e.target.value);
              }}
              className="text-[12px] font-semibold text-ge-primary bg-transparent focus:outline-none cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Interactive Month Calendar Widget */}
      <div className="mt-4 rounded-2xl border border-ge-border bg-white p-3.5 sm:p-5 shadow-xs w-full max-w-full min-w-0">
        {/* Month Header with Prev/Next Controls */}
        <div className="flex items-center justify-between border-b border-ge-border pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold text-ge-navy">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h3>
            {activeDateIso !== todayIso && (
              <button
                type="button"
                onClick={() => {
                  const [ty, tm] = todayIso.split("-").map(Number);
                  setViewYear(ty);
                  setViewMonth(tm - 1);
                  handleSelectDate(todayIso);
                }}
                className="rounded-lg bg-ge-soft-bg px-2 py-0.5 text-[11px] font-semibold text-ge-primary hover:bg-ge-blue-tint transition"
              >
                Go to Today
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-ge-border bg-white text-ge-ink hover:bg-ge-soft-bg transition"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-ge-border bg-white text-ge-ink hover:bg-ge-soft-bg transition"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11.5px] font-semibold text-ge-muted">
          {DAY_NAMES.map((name) => (
            <div key={name} className="py-1">
              {name}
            </div>
          ))}
        </div>

        {/* Days Grid (7 columns, perfectly responsive) */}
        <div className="mt-1 grid grid-cols-7 gap-1">
          {/* Empty cells before 1st day of month */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9 sm:h-10" />
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const isPast = dateStr < todayIso;
            const isSelected = dateStr === activeDateIso;
            const isToday = dateStr === todayIso;

            if (isPast) {
              return (
                <div
                  key={dateStr}
                  className="flex h-9 sm:h-10 items-center justify-center rounded-xl text-[12px] text-neutral-300 cursor-not-allowed select-none"
                >
                  {dayNum}
                </div>
              );
            }

            return (
              <button
                type="button"
                key={dateStr}
                onClick={() => handleSelectDate(dateStr)}
                className={`relative flex h-9 sm:h-10 items-center justify-center rounded-xl text-[12.5px] font-medium transition ${
                  isSelected
                    ? "bg-ge-primary text-white font-bold shadow-xs scale-102"
                    : "bg-white text-ge-ink hover:bg-ge-blue-tint/60 hover:text-ge-primary border border-transparent hover:border-ge-primary/30"
                } ${isToday && !isSelected ? "ring-2 ring-ge-primary/40 font-semibold" : ""}`}
              >
                {dayNum}
                {isToday && (
                  <span
                    className={`absolute bottom-1 h-1 w-1 rounded-full ${
                      isSelected ? "bg-white" : "bg-ge-primary"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Slots Section */}
      <div className="mt-6 rounded-2xl border border-ge-border bg-ge-soft-bg/40 p-4 sm:p-5 w-full max-w-full min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ge-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ge-primary">
                Available Shifts & Timings
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold border ${activeShiftBadge.color}`}>
                {activeShiftBadge.label}
              </span>
            </div>
            <h3 className="text-[16px] font-bold text-ge-ink">
              {activeDateIso === todayIso ? "Today" : selectedDateLabel.split(",")[0]} · {selectedDateLabel}
            </h3>
          </div>
          <span className="text-[12px] font-medium text-ge-muted">
            <strong className="text-emerald-700">{openTotalCount}</strong> of {slotPills.length} slots active
          </span>
        </div>

        {/* 3 Shifts Filter Tabs with Urdu & English Labels */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {/* ALL SHIFTS */}
          <button
            type="button"
            onClick={() => setSelectedShift("ALL")}
            className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition ${
              selectedShift === "ALL"
                ? "border-ge-primary bg-ge-primary text-white shadow-xs"
                : "border-ge-border bg-white text-ge-ink hover:border-ge-primary/40 hover:bg-ge-blue-tint/20"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[12.5px] font-bold">
              <span>⚡</span>
              <span>All Shifts</span>
              <span className="text-[11px] opacity-80">(تمام)</span>
            </div>
            <div className={`mt-0.5 text-[10.5px] ${selectedShift === "ALL" ? "text-white/80" : "text-ge-muted"}`}>
              {openTotalCount} active · 24h
            </div>
          </button>

          {/* MORNING SHIFT */}
          <button
            type="button"
            onClick={() => setSelectedShift("MORNING")}
            className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition ${
              selectedShift === "MORNING"
                ? "border-amber-500 bg-amber-500 text-white shadow-xs"
                : "border-ge-border bg-white text-ge-ink hover:border-amber-400 hover:bg-amber-50/50"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[12.5px] font-bold">
              <span>🌅</span>
              <span>Morning</span>
              <span className="text-[11px] opacity-80">(صبح)</span>
            </div>
            <div className={`mt-0.5 text-[10.5px] ${selectedShift === "MORNING" ? "text-white/90" : "text-amber-800"}`}>
              {openMorningCount} active · 08 AM–04 PM
            </div>
          </button>

          {/* EVENING SHIFT */}
          <button
            type="button"
            onClick={() => setSelectedShift("EVENING")}
            className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition ${
              selectedShift === "EVENING"
                ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                : "border-ge-border bg-white text-ge-ink hover:border-indigo-400 hover:bg-indigo-50/50"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[12.5px] font-bold">
              <span>🌆</span>
              <span>Evening</span>
              <span className="text-[11px] opacity-80">(شام)</span>
            </div>
            <div className={`mt-0.5 text-[10.5px] ${selectedShift === "EVENING" ? "text-white/90" : "text-indigo-800"}`}>
              {openEveningCount} active · 04 PM–12 AM
            </div>
          </button>

          {/* NIGHT SHIFT */}
          <button
            type="button"
            onClick={() => setSelectedShift("NIGHT")}
            className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition ${
              selectedShift === "NIGHT"
                ? "border-purple-600 bg-purple-600 text-white shadow-xs"
                : "border-ge-border bg-white text-ge-ink hover:border-purple-400 hover:bg-purple-50/50"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[12.5px] font-bold">
              <span>🌙</span>
              <span>Night</span>
              <span className="text-[11px] opacity-80">(رات)</span>
            </div>
            <div className={`mt-0.5 text-[10.5px] ${selectedShift === "NIGHT" ? "text-white/90" : "text-purple-800"}`}>
              {openNightCount} active · 12 AM–08 AM
            </div>
          </button>
        </div>

        {/* Doctor Day Off or Shift Handover Notice */}
        {openTotalCount === 0 && (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/90 p-3.5 text-[12.5px] text-amber-900">
            <span className="text-xl">🌴</span>
            <div>
              <strong>Doctor is on leave or unavailable on this date.</strong>
              <div className="text-[11.5px] text-amber-700">Please choose another date from the calendar above to view open slots.</div>
            </div>
          </div>
        )}

        {selectedShift !== "ALL" && filteredSlots.filter((s) => s.isOpen).length === 0 && openTotalCount > 0 && (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-blue-200 bg-blue-50/80 p-3.5 text-[12.5px] text-blue-900">
            <span className="text-xl">🔄</span>
            <div>
              <strong>Doctor is off-duty during {SHIFT_CONFIG[selectedShift].labelEn} Shift ({SHIFT_CONFIG[selectedShift].labelUr}).</strong>
              <div className="text-[11.5px] text-blue-700">
                Doctor has designated their consultation hours to another shift on this date. Select &quot;All Shifts&quot; above to view all available slots.
              </div>
            </div>
          </div>
        )}

        {/* Slots Grid */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 w-full min-w-0">
          {filteredSlots.map((s) => {
            const shiftBadge =
              s.shift === "MORNING"
                ? { emoji: "🌅", label: "Morning", color: "text-amber-700 bg-amber-50" }
                : s.shift === "EVENING"
                ? { emoji: "🌆", label: "Evening", color: "text-indigo-700 bg-indigo-50" }
                : { emoji: "🌙", label: "Night", color: "text-purple-700 bg-purple-50" };

            if (s.isOpen && s.slotId) {
              return (
                <Link
                  key={`${s.shift}-${s.timeLabel}`}
                  href={`/doctor/${doctorSlug}/book?slot=${s.slotId}`}
                  className="group flex flex-col items-center justify-center rounded-2xl border border-ge-primary/30 bg-white p-2.5 text-center transition hover:border-ge-primary hover:bg-ge-primary hover:text-white shadow-2xs"
                >
                  <div className="flex items-center gap-1 text-[10px] font-semibold opacity-75 group-hover:text-white/90">
                    <span>{shiftBadge.emoji}</span>
                    <span>{shiftBadge.label}</span>
                  </div>
                  <span className="mt-0.5 text-[13px] font-bold text-ge-ink group-hover:text-white">
                    {s.timeLabel}
                  </span>
                  <span className="mt-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 group-hover:bg-white/20 group-hover:text-white">
                    Available
                  </span>
                </Link>
              );
            }

            if (s.isBooked) {
              return (
                <div
                  key={`${s.shift}-${s.timeLabel}`}
                  title="This slot is already booked by another patient"
                  className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/70 p-2.5 text-center cursor-not-allowed opacity-80"
                >
                  <div className="flex items-center gap-1 text-[10px] text-rose-500">
                    <span>{shiftBadge.emoji}</span>
                    <span>{shiftBadge.label}</span>
                  </div>
                  <span className="mt-0.5 text-[12.5px] font-medium text-rose-700/80 line-through">
                    {s.timeLabel}
                  </span>
                  <span className="mt-1 text-[10px] font-bold text-rose-600">
                    Booked
                  </span>
                </div>
              );
            }

            if (s.isBlocked) {
              return (
                <div
                  key={`${s.shift}-${s.timeLabel}`}
                  title="Doctor is off-duty in this shift (Coverage handed over to rotation doctor)"
                  className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100/70 p-2.5 text-center cursor-not-allowed opacity-75"
                >
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                    <span>{shiftBadge.emoji}</span>
                    <span>{shiftBadge.label}</span>
                  </div>
                  <span className="mt-0.5 text-[12px] font-medium text-neutral-500">
                    {s.timeLabel}
                  </span>
                  <span className="mt-1 text-[10px] text-neutral-400 font-medium">
                    Off Duty
                  </span>
                </div>
              );
            }

            // Past slot
            return (
              <div
                key={`${s.shift}-${s.timeLabel}`}
                title="This time has passed"
                className="flex flex-col items-center justify-center rounded-2xl border border-neutral-100 bg-neutral-50/60 p-2.5 text-center cursor-not-allowed opacity-40"
              >
                <div className="flex items-center gap-1 text-[10px] text-neutral-300">
                  <span>{shiftBadge.emoji}</span>
                  <span>{shiftBadge.label}</span>
                </div>
                <span className="mt-0.5 text-[12px] font-medium text-neutral-400">
                  {s.timeLabel}
                </span>
                <span className="mt-1 text-[10px] text-neutral-400">
                  Passed
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
