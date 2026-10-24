"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { assignNurseAction } from "@/lib/actions/home-care";

type Nurse = { id: string; name: string; city: string; level: string };

export function AssignNurseControl({
  requestId,
  currentNurseId,
  nurses,
}: {
  requestId: string;
  currentNurseId: string | null;
  nurses: Nurse[];
}) {
  const [pending, start] = React.useTransition();
  const [pickId, setPickId] = React.useState(currentNurseId ?? "");

  return (
    <div className="flex items-center gap-2">
      <select
        value={pickId}
        onChange={(e) => setPickId(e.target.value)}
        disabled={pending}
        className="h-8 rounded-md border border-ge-border bg-white px-2 text-[12px]"
      >
        <option value="">— select nurse —</option>
        {nurses.map((n) => (
          <option key={n.id} value={n.id}>
            {n.name} · {n.city} · {n.level === "SENIOR" ? "Sr" : "Jr"}
          </option>
        ))}
      </select>
      <Button
        size="sm"
        loading={pending}
        disabled={!pickId || pickId === currentNurseId}
        onClick={() =>
          start(async () => {
            const res = await assignNurseAction({ requestId, nurseId: pickId });
            if (!res.ok) toast.error(res.error);
            else toast.success("Nurse assigned.");
          })
        }
      >
        {currentNurseId ? "Reassign" : "Assign"}
      </Button>
    </div>
  );
}
