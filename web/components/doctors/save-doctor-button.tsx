"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleSavedDoctorAction } from "@/lib/actions/saved";

export function SaveDoctorButton({
  doctorId,
  initialSaved,
  className,
}: {
  doctorId: string;
  initialSaved: boolean;
  className?: string;
}) {
  const [saved, setSaved] = React.useState(initialSaved);
  const [pending, start] = React.useTransition();

  return (
    <Button
      type="button"
      variant={saved ? "secondary" : "ghost"}
      size="sm"
      loading={pending}
      className={className}
      aria-pressed={saved}
      onClick={() =>
        start(async () => {
          const prev = saved;
          setSaved(!prev);
          const res = await toggleSavedDoctorAction({ doctorId });
          if (!res.ok) {
            setSaved(prev);
            toast.error(res.error);
          } else {
            setSaved(res.saved);
            toast.success(res.saved ? "Saved to your list." : "Removed from saved.");
          }
        })
      }
    >
      <Heart className={cn("h-4 w-4", saved && "fill-current text-[color:var(--ge-danger)]")} />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
