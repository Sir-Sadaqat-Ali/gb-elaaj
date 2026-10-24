"use client";

import * as React from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { UploadField, type UploadResult } from "@/components/uploads/upload-field";
import { updateLabBookingStatusAction, uploadLabReportAction } from "@/lib/actions/labs";

const NEXT: Record<string, string[]> = {
  BOOKED: ["COLLECTED", "CANCELLED"],
  COLLECTED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["REPORTED", "CANCELLED"],
  REPORTED: [],
  CANCELLED: [],
};

const LABEL: Record<string, string> = {
  COLLECTED: "Sample collected",
  PROCESSING: "Send to processing",
  REPORTED: "Mark reported",
  CANCELLED: "Cancel",
};

type Param = {
  name: string;
  value: string;
  unit?: string;
  range?: string;
  flag: "normal" | "low" | "high" | "abnormal";
};

export function LabBookingActions({ bookingId, status, hasReport }: { bookingId: string; status: string; hasReport: boolean }) {
  const [pending, start] = React.useTransition();
  const [showReport, setShowReport] = React.useState(hasReport);
  const [upload, setUpload] = React.useState<UploadResult | null>(null);
  const [summary, setSummary] = React.useState("");
  const [abnormal, setAbnormal] = React.useState(false);
  const [params, setParams] = React.useState<Param[]>([{ name: "", value: "", unit: "", range: "", flag: "normal" }]);

  const transitions = NEXT[status] ?? [];

  function transition(s: string) {
    start(async () => {
      const res = await updateLabBookingStatusAction({ bookingId, status: s as Parameters<typeof updateLabBookingStatusAction>[0]["status"] });
      if (!res.ok) toast.error(res.error);
      else toast.success(`Status: ${s.toLowerCase()}.`);
    });
  }

  function uploadReport() {
    const cleaned = params
      .filter((p) => p.name.trim() && p.value.trim())
      .map((p) => ({
        name: p.name.trim(),
        value: p.value.trim(),
        unit: p.unit?.trim() || undefined,
        range: p.range?.trim() || undefined,
        flag: p.flag,
      }));
    start(async () => {
      const res = await uploadLabReportAction({
        bookingId,
        fileKey: upload?.fileKey || undefined,
        fileMime: (upload?.fileMime as "application/pdf" | "image/png" | "image/jpeg" | "image/webp") || undefined,
        fileSize: upload?.fileSize || undefined,
        summary: summary.trim() || undefined,
        abnormal,
        parameters: cleaned,
      });
      if (!res.ok) toast.error(res.error);
      else toast.success("Report uploaded and patient notified.");
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {transitions.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={s === "CANCELLED" ? "destructive-outline" : "primary"}
            loading={pending}
            onClick={() => transition(s)}
          >
            {LABEL[s] ?? s}
          </Button>
        ))}
        {transitions.length === 0 && <p className="text-[12px] text-ge-muted">No transitions left.</p>}
      </div>

      <div className="rounded-md border border-ge-border bg-ge-soft-bg p-3">
        <button
          type="button"
          className="text-[12.5px] font-semibold text-ge-primary hover:underline"
          onClick={() => setShowReport((v) => !v)}
        >
          {showReport ? "Hide" : "Upload"} report
        </button>
        {showReport && (
          <div className="mt-3 space-y-3">
            <UploadField
              category="lab-report"
              label="Report file"
              hint="Upload the signed lab report (PDF, PNG, or JPG). Patient will see this securely via signed link."
              value={upload && upload.fileKey ? upload : null}
              onUploaded={(r) => setUpload(r.fileKey ? r : null)}
            />
            <Field label="Summary (optional)">
              <Textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="All values within normal range." />
            </Field>
            <label className="flex items-center gap-2 text-[12.5px]">
              <input type="checkbox" checked={abnormal} onChange={(e) => setAbnormal(e.target.checked)} className="accent-ge-primary" />
              Flag as abnormal — patient sees a warning
            </label>

            <div>
              <div className="mb-1.5 text-[11.5px] font-semibold text-ge-navy">Structured parameters</div>
              <ul className="space-y-2">
                {params.map((p, i) => (
                  <li key={i} className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr_1fr_auto] gap-1.5">
                    <Input value={p.name} onChange={(e) => setParams((arr) => arr.map((x, k) => k === i ? { ...x, name: e.target.value } : x))} placeholder="Hemoglobin" />
                    <Input value={p.value} onChange={(e) => setParams((arr) => arr.map((x, k) => k === i ? { ...x, value: e.target.value } : x))} placeholder="14.2" />
                    <Input value={p.unit ?? ""} onChange={(e) => setParams((arr) => arr.map((x, k) => k === i ? { ...x, unit: e.target.value } : x))} placeholder="g/dL" />
                    <Input value={p.range ?? ""} onChange={(e) => setParams((arr) => arr.map((x, k) => k === i ? { ...x, range: e.target.value } : x))} placeholder="12-16" />
                    <select
                      value={p.flag}
                      onChange={(e) => setParams((arr) => arr.map((x, k) => k === i ? { ...x, flag: e.target.value as Param["flag"] } : x))}
                      className="h-10 rounded-md border border-ge-border bg-white px-2 text-[12px]"
                    >
                      <option value="normal">normal</option>
                      <option value="low">low</option>
                      <option value="high">high</option>
                      <option value="abnormal">abnormal</option>
                    </select>
                    <Button type="button" variant="ghost" size="icon" aria-label="Remove" onClick={() => setParams((arr) => arr.filter((_, k) => k !== i))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
              <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => setParams((arr) => [...arr, { name: "", value: "", unit: "", range: "", flag: "normal" }])}>
                <Plus className="h-3.5 w-3.5" /> Add parameter
              </Button>
            </div>
            <Button onClick={uploadReport} loading={pending}>
              <Upload className="h-3.5 w-3.5" /> Upload report
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
