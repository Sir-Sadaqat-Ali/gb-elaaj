"use client";

import * as React from "react";
import { toast } from "sonner";
import { Video, Building, Lock, CheckCircle2, Palmtree, Sun, Sunset, Moon, Sparkles, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/data/confirm-button";
import { blockSlotAction, toggleDayOffAction, setDoctorActiveShiftAction, toggleShiftAction } from "@/lib/actions/schedule";

export type ShiftCategory = "MORNING" | "EVENING" | "NIGHT";

export interface ScheduleSlotItem {
  id: string;
  startsAt: string;
  endsAt: string;
  mode: "VIDEO" | "CLINIC";
  status: "OPEN" | "BLOCKED" | "BOOKED";
  shift: ShiftCategory;
  timeLabel: string;
}

export function DoctorScheduleManager({
  dateIso,
  assignedShift,
  slots,
}: {
  dateIso: string;
  assignedShift: ShiftCategory;
  slots: ScheduleSlotItem[];
}) {
  const [selectedTab, setSelectedTab] = React.useState<"ALL" | ShiftCategory>("ALL");
  const [isPending, startTransition] = React.useTransition();

  // Shift slot groups
  const morningSlots = slots.filter((s) => s.shift === "MORNING");
  const eveningSlots = slots.filter((s) => s.shift === "EVENING");
  const nightSlots = slots.filter((s) => s.shift === "NIGHT");

  const morningOpen = morningSlots.filter((s) => s.status === "OPEN").length;
  const eveningOpen = eveningSlots.filter((s) => s.status === "OPEN").length;
  const nightOpen = nightSlots.filter((s) => s.status === "OPEN").length;

  const totalOpen = slots.filter((s) => s.status === "OPEN").length;
  const totalBlocked = slots.filter((s) => s.status === "BLOCKED").length;
  const totalBooked = slots.filter((s) => s.status === "BOOKED").length;
  const isFullDayOff = totalOpen === 0 && totalBlocked > 0;

  const filteredSlots =
    selectedTab === "ALL" ? slots : slots.filter((s) => s.shift === selectedTab);

  function handleSetShift(shift: "MORNING" | "EVENING" | "NIGHT" | "ALL" | "NONE") {
    startTransition(async () => {
      const res = await setDoctorActiveShiftAction({ dateIso, shift });
      if (!res.ok) {
        toast.error(res.error || "Failed to update shift.");
      } else {
        if (shift === "ALL") {
          toast.success("All 24 hours activated for patient bookings.");
        } else if (shift === "NONE") {
          toast.success("Day marked as off. All open slots disabled.");
        } else {
          const name = shift === "MORNING" ? "Morning (صبح)" : shift === "EVENING" ? "Evening (شام)" : "Night (رات)";
          toast.success(`${name} shift activated. Other shifts disabled.`);
        }
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* ── 3 SHIFT CONTROL CENTER (Client requirement: Activate one shift, disable others) ── */}
      <div className="rounded-3xl border border-ge-border bg-gradient-to-br from-ge-soft-bg/80 via-white to-ge-blue-tint/30 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ge-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[17px] font-bold text-ge-navy">Shift Control &amp; 24-Hour Coverage</h3>
              <Badge variant="success">Active Rotation</Badge>
            </div>
            <p className="mt-1 text-[12.5px] text-ge-muted">
              Select your active working shift. Gb Elaaj automatically activates your chosen shift and disables off-duty hours.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSetShift("ALL")}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-ge-navy px-3 text-[11.5px] font-semibold text-white shadow-2xs hover:bg-ge-navy/90 transition disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Activate All 24h (24 گھنٹے)</span>
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSetShift("NONE")}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 text-[11.5px] font-semibold text-amber-800 hover:bg-amber-100 transition disabled:opacity-50"
            >
              <Palmtree className="h-3.5 w-3.5 text-amber-600" />
              <span>Mark Day Off (چھٹی)</span>
            </button>
          </div>
        </div>

        {/* 3 Shift Cards Grid */}
        <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {/* 1. MORNING SHIFT */}
          <div
            className={`rounded-2xl border p-4 transition ${
              morningOpen > 0
                ? "border-amber-300 bg-amber-50/80 shadow-xs"
                : "border-ge-border bg-white opacity-85"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-lg">
                  🌅
                </span>
                <div>
                  <h4 className="text-[14px] font-bold text-ge-ink">Morning (صبح)</h4>
                  <div className="text-[11px] text-ge-muted">08:00 AM – 04:00 PM</div>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                  morningOpen > 0
                    ? "bg-amber-200 text-amber-900"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {morningOpen > 0 ? "Active" : "Disabled"}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-amber-200/50 pt-2.5 text-[11.5px]">
              <span className="text-ge-muted">
                <strong>{morningOpen}</strong> / {morningSlots.length} slots active
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSetShift("MORNING")}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition ${
                  morningOpen > 0 && eveningOpen === 0 && nightOpen === 0
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "border border-amber-400 bg-white text-amber-900 hover:bg-amber-100"
                }`}
              >
                {morningOpen > 0 && eveningOpen === 0 && nightOpen === 0
                  ? "✓ Active Duty"
                  : "Activate Morning (صبح)"}
              </button>
            </div>
          </div>

          {/* 2. EVENING SHIFT */}
          <div
            className={`rounded-2xl border p-4 transition ${
              eveningOpen > 0
                ? "border-indigo-300 bg-indigo-50/80 shadow-xs"
                : "border-ge-border bg-white opacity-85"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-lg">
                  🌆
                </span>
                <div>
                  <h4 className="text-[14px] font-bold text-ge-ink">Evening (شام)</h4>
                  <div className="text-[11px] text-ge-muted">04:00 PM – 12:00 AM</div>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                  eveningOpen > 0
                    ? "bg-indigo-200 text-indigo-900"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {eveningOpen > 0 ? "Active" : "Disabled"}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-indigo-200/50 pt-2.5 text-[11.5px]">
              <span className="text-ge-muted">
                <strong>{eveningOpen}</strong> / {eveningSlots.length} slots active
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSetShift("EVENING")}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition ${
                  eveningOpen > 0 && morningOpen === 0 && nightOpen === 0
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "border border-indigo-400 bg-white text-indigo-900 hover:bg-indigo-100"
                }`}
              >
                {eveningOpen > 0 && morningOpen === 0 && nightOpen === 0
                  ? "✓ Active Duty"
                  : "Activate Evening (شام)"}
              </button>
            </div>
          </div>

          {/* 3. NIGHT SHIFT */}
          <div
            className={`rounded-2xl border p-4 transition ${
              nightOpen > 0
                ? "border-purple-300 bg-purple-50/80 shadow-xs"
                : "border-ge-border bg-white opacity-85"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-lg">
                  🌙
                </span>
                <div>
                  <h4 className="text-[14px] font-bold text-ge-ink">Night (رات)</h4>
                  <div className="text-[11px] text-ge-muted">12:00 AM – 08:00 AM</div>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                  nightOpen > 0
                    ? "bg-purple-200 text-purple-900"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {nightOpen > 0 ? "Active" : "Disabled"}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-purple-200/50 pt-2.5 text-[11.5px]">
              <span className="text-ge-muted">
                <strong>{nightOpen}</strong> / {nightSlots.length} slots active
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSetShift("NIGHT")}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition ${
                  nightOpen > 0 && morningOpen === 0 && eveningOpen === 0
                    ? "bg-purple-600 text-white shadow-2xs"
                    : "border border-purple-400 bg-white text-purple-900 hover:bg-purple-100"
                }`}
              >
                {nightOpen > 0 && morningOpen === 0 && eveningOpen === 0
                  ? "✓ Active Duty"
                  : "Activate Night (رات)"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SUMMARY STATS BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ge-border bg-white p-3.5 sm:p-4 text-[12.5px] shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {totalOpen} Active Slots
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-700 border border-neutral-300">
            <Lock className="h-3.5 w-3.5 text-neutral-500" /> {totalBlocked} Disabled / Off Duty
          </span>
          {totalBooked > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 font-semibold text-ge-primary border border-blue-200">
              ● {totalBooked} Patient Booked
            </span>
          )}
        </div>

        <div className="text-[12px] text-ge-muted">
          Showing <strong>{filteredSlots.length}</strong> of {slots.length} total 20-min slots
        </div>
      </div>

      {/* ── SHIFT FILTER TABS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedTab("ALL")}
          className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-4 py-2 text-center text-[12.5px] font-bold transition ${
            selectedTab === "ALL"
              ? "border-2 border-ge-primary bg-ge-primary text-white shadow-xs"
              : "border border-ge-border bg-white text-ge-ink hover:border-ge-primary/40 hover:bg-ge-blue-tint/20"
          }`}
        >
          <span>⚡</span>
          <span>All 24 Hours</span>
          <span className="text-[11px] opacity-80">({totalOpen} active)</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab("MORNING")}
          className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-4 py-2 text-center text-[12.5px] font-bold transition ${
            selectedTab === "MORNING"
              ? "border-2 border-amber-500 bg-amber-500 text-white shadow-xs"
              : "border border-ge-border bg-white text-ge-ink hover:border-amber-400 hover:bg-amber-50/50"
          }`}
        >
          <span>🌅</span>
          <span>Morning (صبح)</span>
          <span className="text-[11px] opacity-80">({morningOpen} active)</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab("EVENING")}
          className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-4 py-2 text-center text-[12.5px] font-bold transition ${
            selectedTab === "EVENING"
              ? "border-2 border-indigo-600 bg-indigo-600 text-white shadow-xs"
              : "border border-ge-border bg-white text-ge-ink hover:border-indigo-400 hover:bg-indigo-50/50"
          }`}
        >
          <span>🌆</span>
          <span>Evening (شام)</span>
          <span className="text-[11px] opacity-80">({eveningOpen} active)</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab("NIGHT")}
          className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-4 py-2 text-center text-[12.5px] font-bold transition ${
            selectedTab === "NIGHT"
              ? "border-2 border-purple-600 bg-purple-600 text-white shadow-xs"
              : "border border-ge-border bg-white text-ge-ink hover:border-purple-400 hover:bg-purple-50/50"
          }`}
        >
          <span>🌙</span>
          <span>Night (رات)</span>
          <span className="text-[11px] opacity-80">({nightOpen} active)</span>
        </button>
      </div>

      {/* ── EDITABLE SLOT BOXES ("Dabbe Dabbe" - Client requirement: Toggle/edit individual slots) ── */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredSlots.map((s) => {
          const shiftBadge =
            s.shift === "MORNING"
              ? { emoji: "🌅", name: "Morning", color: "text-amber-800 bg-amber-50 border-amber-200" }
              : s.shift === "EVENING"
              ? { emoji: "🌆", name: "Evening", color: "text-indigo-800 bg-indigo-50 border-indigo-200" }
              : { emoji: "🌙", name: "Night", color: "text-purple-800 bg-purple-50 border-purple-200" };

          return (
            <div
              key={s.id}
              className={`flex items-center justify-between gap-2 rounded-2xl border p-3 transition shadow-2xs ${
                s.status === "OPEN"
                  ? "border-emerald-200 bg-emerald-50/40"
                  : s.status === "BLOCKED"
                  ? "border-neutral-200 bg-neutral-50/80 opacity-75"
                  : "border-blue-200 bg-blue-50/60"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[13.5px] text-ge-ink">
                    {s.timeLabel}
                  </span>
                  <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.2 text-[10px] font-medium border ${shiftBadge.color}`}>
                    <span>{shiftBadge.emoji}</span>
                    <span>{shiftBadge.name}</span>
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant={
                      s.status === "BOOKED"
                        ? "info"
                        : s.status === "OPEN"
                        ? "success"
                        : "neutral"
                    }
                  >
                    {s.status === "OPEN" ? "Active" : s.status === "BLOCKED" ? "Disabled" : "Booked"}
                  </Badge>
                  <span className="text-[11px] text-ge-muted inline-flex items-center gap-0.5">
                    {s.mode === "VIDEO" ? (
                      <Video className="h-3 w-3 text-ge-primary" />
                    ) : (
                      <Building className="h-3 w-3 text-emerald-600" />
                    )}
                    {s.mode === "VIDEO" ? "Video" : "Clinic"}
                  </span>
                </div>
              </div>

              {s.status !== "BOOKED" ? (
                <ConfirmButton
                  action={blockSlotAction}
                  arg={{ slotId: s.id }}
                  label={s.status === "BLOCKED" ? "Make Active" : "Disable"}
                  variant={s.status === "BLOCKED" ? "primary" : "ghost"}
                  successMsg={s.status === "BLOCKED" ? "Slot is now active." : "Slot disabled."}
                  className={`h-7 px-2.5 text-[11px] font-semibold ${
                    s.status === "BLOCKED"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "text-neutral-600 hover:bg-neutral-200 border border-neutral-300"
                  }`}
                />
              ) : (
                <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-[10.5px] font-bold text-ge-primary">
                  Booked
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
