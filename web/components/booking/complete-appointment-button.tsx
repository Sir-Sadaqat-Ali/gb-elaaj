"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { completeAppointmentAction } from "@/lib/actions/appointments";

export function CompleteAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const [pending, start] = React.useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 px-2"
      loading={pending}
      aria-label="Mark complete"
      onClick={() =>
        start(async () => {
          const res = await completeAppointmentAction({ appointmentId });
          if (!res.ok) toast.error(res.error);
          else toast.success("Marked complete.");
        })
      }
    >
      <Check className="h-3.5 w-3.5" />
    </Button>
  );
}
