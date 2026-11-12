"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type SlotPill = {
  startsAt: string;
  timeLabel: string;
  isPast: boolean;
  isBooked: boolean;
  isBlocked: boolean;
  isOpen: boolean;
  slotId: string | null;
};

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function DoctorCalendarSlots({
  doctorSlug,
  todayIso,
  activeDateIso,
  slotPills,
}: {
  doctorSlug: string;
  todayIso: string;
  activeDateIso: string;
  slotPills: SlotPill[];
}) {
  const router = useRouter();
  const [ay, am, ad] = activeDateIso.split("-").map(Number);
  const [viewYear, setViewYear] = React.useState(ay);
  const [viewMonth, setViewMonth] = React.useState(am - 1); // 0-indexed

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

  return (
    <div className="w-full min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ge-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-bold text-ge-ink">Doctor Availability Calendar</h2>
            <Badge variant="success">Live</Badge>
          </div>
          <p className="mt-1 text-[12.5px] text-ge-muted">
            Select any date from the calendar below to view all 20-min slots (10:00 AM – 5:00 PM).
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
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ge-primary">
              Available Timings
            </span>
            <h3 className="text-[16px] font-bold text-ge-ink">
              {activeDateIso === todayIso ? "Today" : selectedDateLabel.split(",")[0]} · {selectedDateLabel}
            </h3>
          </div>
          <span className="text-[12px] text-ge-muted">
            {slotPills.filter((s) => s.isOpen).length} slots available
          </span>
        </div>

        {slotPills.filter((s) => s.isOpen).length === 0 && (
          <div className="mt-3.5 flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/90 p-3.5 text-[12.5px] text-amber-900">
            <span className="text-lg">🌴</span>
            <div>
              <strong>Doctor is on leave or unavailable on this date.</strong>
              <div className="text-[11.5px] text-amber-700">Please choose another date from the calendar above to view open slots.</div>
            </div>
          </div>
        )}

        {/* 21 Slots Grid */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 w-full min-w-0">
          {slotPills.map((s) => {
            if (s.isOpen && s.slotId) {
              return (
                <Link
                  key={s.timeLabel}
                  href={`/doctor/${doctorSlug}/book?slot=${s.slotId}`}
                  className="group flex flex-col items-center justify-center rounded-2xl border border-ge-primary/30 bg-white p-2.5 text-center transition hover:border-ge-primary hover:bg-ge-primary hover:text-white shadow-2xs"
                >
                  <span className="text-[12.5px] font-semibold text-ge-ink group-hover:text-white">
                    {s.timeLabel}
                  </span>
                  <span className="mt-0.5 text-[10px] font-medium text-ge-primary group-hover:text-white/90">
                    Available
                  </span>
                </Link>
              );
            }

            if (s.isBooked) {
              return (
                <div
                  key={s.timeLabel}
                  title="This slot is already booked by another patient"
                  className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/70 p-2.5 text-center cursor-not-allowed opacity-80"
                >
                  <span className="text-[12px] font-medium text-rose-700/80 line-through">
                    {s.timeLabel}
                  </span>
                  <span className="mt-0.5 text-[10px] font-bold text-rose-600">
                    Booked
                  </span>
                </div>
              );
            }

            if (s.isBlocked) {
              return (
                <div
                  key={s.timeLabel}
                  title="Doctor is unavailable at this time"
                  className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100/80 p-2.5 text-center cursor-not-allowed opacity-75"
                >
                  <span className="text-[12px] font-medium text-neutral-500">
                    {s.timeLabel}
                  </span>
                  <span className="mt-0.5 text-[10px] text-neutral-400">
                    Unavailable
                  </span>
                </div>
              );
            }

            // Past slot
            return (
              <div
                key={s.timeLabel}
                title="This time has passed"
                className="flex flex-col items-center justify-center rounded-2xl border border-neutral-100 bg-neutral-50/60 p-2.5 text-center cursor-not-allowed opacity-40"
              >
                <span className="text-[12px] font-medium text-neutral-400">
                  {s.timeLabel}
                </span>
                <span className="mt-0.5 text-[10px] text-neutral-400">
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
