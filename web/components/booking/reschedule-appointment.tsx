"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Building, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { rescheduleAppointmentAction } from "@/lib/actions/appointments";
import { formatDate, formatTime } from "@/lib/formatting";

type Slot = { id: string; startsAt: string; mode: "VIDEO" | "CLINIC" };

export function RescheduleAppointment({ appointmentId, slots }: { appointmentId: string; slots: Slot[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();

  const grouped = React.useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const key = formatDate(new Date(s.startsAt));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries());
  }, [slots]);

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <CalendarClock className="h-4 w-4" /> Reschedule
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-ge-border bg-ge-soft-bg p-3">
      <p className="text-[12.5px] font-medium text-ge-ink">Pick a new time</p>
      <div className="max-h-64 space-y-3 overflow-y-auto">
        {grouped.map(([day, daySlots]) => (
          <div key={day}>
            <div className="mb-1.5 text-[11px] font-semibold text-ge-navy">{day}</div>
            <div className="grid grid-cols-3 gap-1.5">
              {daySlots.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelected(s.id)}
                  aria-pressed={selected === s.id}
                  className={`inline-flex items-center justify-center gap-1 rounded-full border px-2 py-1.5 text-[11.5px] font-medium ${
                    selected === s.id
                      ? "border-ge-primary bg-ge-primary text-white"
                      : "border-ge-border bg-white text-ge-ink hover:border-ge-primary"
                  }`}
                >
                  {s.mode === "VIDEO" ? <Video className="h-3 w-3" /> : <Building className="h-3 w-3" />}
                  {formatTime(new Date(s.startsAt))}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          loading={pending}
          disabled={!selected}
          onClick={() =>
            start(async () => {
              if (!selected) return;
              const res = await rescheduleAppointmentAction({ appointmentId, newSlotId: selected });
              if (!res.ok) {
                toast.error(res.error);
              } else {
                toast.success("Appointment rescheduled.");
                setOpen(false);
                router.refresh();
              }
            })
          }
        >
          Confirm new time
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
