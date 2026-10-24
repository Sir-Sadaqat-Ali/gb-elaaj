"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { UploadField, type UploadResult } from "@/components/uploads/upload-field";
import { addPatientDocumentAction } from "@/lib/actions/records";

export function PatientDocumentUpload() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [note, setNote] = React.useState("");
  const [file, setFile] = React.useState<UploadResult | null>(null);
  const [pending, start] = React.useTransition();

  const canSave = title.trim().length >= 2 && !!file?.fileKey;

  function save() {
    if (!canSave || !file) return;
    start(async () => {
      const res = await addPatientDocumentAction({
        title,
        note,
        fileKey: file.fileKey,
        fileMime: file.fileMime,
        fileSize: file.fileSize,
      });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Document added to your records.");
        setTitle("");
        setNote("");
        setFile(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. MRI scan — March 2026" /></Field>
      <Field label="Note (optional)"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything worth remembering" /></Field>
      <UploadField
        category="medical-record"
        label="Document"
        hint="PDF or image, up to 10 MB. Only you and your doctors can see it."
        value={file?.fileKey ? file : null}
        onUploaded={(r) => setFile(r.fileKey ? r : null)}
      />
      <Button size="sm" loading={pending} disabled={!canSave} onClick={save}>Add to my records</Button>
    </div>
  );
}
