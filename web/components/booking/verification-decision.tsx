"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { decideDoctorVerificationAction } from "@/lib/actions/admin";

export function VerificationDecision({ doctorId }: { doctorId: string }) {
  const [pending, start] = React.useTransition();
  const [rejecting, setRejecting] = React.useState(false);
  const [note, setNote] = React.useState("");

  function decide(decision: "APPROVE" | "REJECT") {
    start(async () => {
      const res = await decideDoctorVerificationAction({ doctorId, decision, note: note || undefined });
      if (!res.ok) toast.error(res.error);
      else toast.success(decision === "APPROVE" ? "Doctor approved." : "Doctor rejected.");
      setRejecting(false);
      setNote("");
    });
  }

  if (rejecting) {
    return (
      <div className="flex w-full flex-col gap-2 md:flex-row md:items-center">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for rejection (required)"
          className="h-9 flex-1 rounded-md border border-ge-border bg-white px-3 text-[12.5px]"
        />
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" loading={pending} disabled={!note.trim()} onClick={() => decide("REJECT")}>
            Confirm reject
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="destructive-outline" loading={pending} onClick={() => setRejecting(true)}>
        <X className="h-3.5 w-3.5" /> Reject
      </Button>
      <Button size="sm" loading={pending} onClick={() => decide("APPROVE")}>
        <Check className="h-3.5 w-3.5" /> Approve
      </Button>
    </div>
  );
}
