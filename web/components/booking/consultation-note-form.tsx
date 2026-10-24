"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { createConsultationNoteAction } from "@/lib/actions/prescriptions";

export function ConsultationNoteForm({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const [pending, start] = React.useTransition();

  return (
    <div className="space-y-2">
      <Textarea
        rows={4}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Quick clinical note for this consultation. The patient can see this in their records."
      />
      <Button
        size="sm"
        variant="secondary"
        loading={pending}
        disabled={note.trim().length < 3}
        onClick={() =>
          start(async () => {
            const res = await createConsultationNoteAction({ appointmentId, note });
            if (!res.ok) toast.error(res.error);
            else {
              toast.success("Note saved to the patient's records.");
              setNote("");
              router.refresh();
            }
          })
        }
      >
        Save note
      </Button>
    </div>
  );
}
