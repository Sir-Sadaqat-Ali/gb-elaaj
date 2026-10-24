"use client";

import * as React from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelAppointmentAction } from "@/lib/actions/appointments";

export function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const [pending, start] = React.useTransition();
  const [confirming, setConfirming] = React.useState(false);
  const [reason, setReason] = React.useState("");

  if (!confirming) {
    return (
      <Button variant="destructive-outline" className="w-full" onClick={() => setConfirming(true)}>
        <X className="h-4 w-4" /> Cancel appointment
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-ge-danger/30 bg-[color:var(--ge-danger-bg)] p-3">
      <p className="text-[12.5px] text-ge-ink">
        Confirm you want to cancel? Refund is processed automatically when cancelled at least 1 hr before.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (optional)"
        rows={2}
        className="w-full rounded-md border border-ge-border bg-white px-2 py-1.5 text-[12px]"
      />
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          loading={pending}
          onClick={() =>
            start(async () => {
              const res = await cancelAppointmentAction({ appointmentId, reason: reason || undefined });
              if (!res.ok) {
                toast.error(res.error);
              } else {
                toast.success("Appointment cancelled.");
                setConfirming(false);
              }
            })
          }
        >
          Yes, cancel
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Keep
        </Button>
      </div>
    </div>
  );
}
