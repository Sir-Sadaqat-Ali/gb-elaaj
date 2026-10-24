"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { generateScheduleAction } from "@/lib/actions/schedule";

export function ScheduleEditor() {
  const today = new Date().toISOString().slice(0, 10);
  const [pending, start] = React.useTransition();
  const [startDate, setStartDate] = React.useState(today);
  const [days, setDays] = React.useState(7);
  const [startHour, setStartHour] = React.useState(10);
  const [endHour, setEndHour] = React.useState(17);
  const [slotMinutes, setSlotMinutes] = React.useState(20);
  const [mode, setMode] = React.useState<"VIDEO" | "CLINIC">("VIDEO");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await generateScheduleAction({ startDate, days, startHour, endHour, slotMinutes, mode });
          if (!res.ok) toast.error(res.error);
          else toast.success(`Created ${res.data?.created ?? 0} slot${res.data?.created === 1 ? "" : "s"}.`);
        });
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Start date">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="Days">
          <Input type="number" min={1} max={14} value={days} onChange={(e) => setDays(Number(e.target.value))} />
        </Field>
        <Field label="Start hour" hint="0–22 (24h)">
          <Input type="number" min={0} max={22} value={startHour} onChange={(e) => setStartHour(Number(e.target.value))} />
        </Field>
        <Field label="End hour" hint="1–23 (24h)">
          <Input type="number" min={1} max={23} value={endHour} onChange={(e) => setEndHour(Number(e.target.value))} />
        </Field>
        <Field label="Slot length (min)">
          <Input type="number" min={10} max={60} step={5} value={slotMinutes} onChange={(e) => setSlotMinutes(Number(e.target.value))} />
        </Field>
        <Field label="Mode">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "VIDEO" | "CLINIC")}
            className="h-10 w-full rounded-md border border-ge-border bg-white px-3 text-sm"
          >
            <option value="VIDEO">Video</option>
            <option value="CLINIC">Clinic</option>
          </select>
        </Field>
      </div>
      <Button type="submit" loading={pending}>Generate slots</Button>
    </form>
  );
}
