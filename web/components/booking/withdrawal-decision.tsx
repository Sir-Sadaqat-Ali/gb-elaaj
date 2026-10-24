"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { decideWithdrawalAction } from "@/lib/actions/withdrawals";

export function WithdrawalDecision({ withdrawalId, status }: { withdrawalId: string; status: string }) {
  const [pending, start] = React.useTransition();
  const terminal = status === "PAID" || status === "REJECTED";

  if (terminal) return <span className="text-[11px] text-ge-muted">—</span>;

  function decide(decision: "APPROVE" | "REJECT" | "PAY" | "HOLD", reason?: string) {
    start(async () => {
      const res = await decideWithdrawalAction({ withdrawalId, decision, reason });
      if (!res.ok) toast.error(res.error);
      else toast.success(`Marked ${decision.toLowerCase()}.`);
    });
  }

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {status === "REQUESTED" && (
        <>
          <Button size="sm" variant="ghost" className="h-7" loading={pending} onClick={() => decide("HOLD")}>Hold</Button>
          <Button size="sm" variant="destructive-outline" className="h-7" loading={pending} onClick={() => {
            const reason = prompt("Reason for rejection?");
            if (reason && reason.trim()) decide("REJECT", reason.trim());
          }}>Reject</Button>
          <Button size="sm" className="h-7" loading={pending} onClick={() => decide("APPROVE")}>Approve</Button>
        </>
      )}
      {status === "APPROVED" && (
        <Button size="sm" className="h-7" loading={pending} onClick={() => decide("PAY")}>Mark paid</Button>
      )}
      {status === "HOLD" && (
        <Button size="sm" className="h-7" loading={pending} onClick={() => decide("APPROVE")}>Release & approve</Button>
      )}
    </div>
  );
}
