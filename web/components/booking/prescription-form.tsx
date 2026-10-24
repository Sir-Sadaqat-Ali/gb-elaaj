"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { prescriptionSchema, type PrescriptionInput } from "@/lib/validation/booking";
import { createPrescriptionAction } from "@/lib/actions/prescriptions";
import { createRxTemplateAction } from "@/lib/actions/rx-templates";

export type RxTemplateOption = {
  id: string;
  name: string;
  diagnosis: string;
  notes: string | null;
  lines: PrescriptionInput["lines"];
};

export function PrescriptionForm({
  appointmentId,
  templates = [],
}: {
  appointmentId: string;
  templates?: RxTemplateOption[];
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [savingTpl, startSaveTpl] = React.useTransition();
  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    formState: { errors },
  } = useForm<PrescriptionInput>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      appointmentId,
      diagnosis: "",
      notes: "",
      lines: [{ drug: "", strength: "", frequency: "", durationDays: 7, notes: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });

  const onSubmit = (values: PrescriptionInput) => {
    start(async () => {
      const res = await createPrescriptionAction(values);
      if (res && !res.ok) toast.error(res.error);
      else toast.success("Prescription saved.");
    });
  };

  function applyTemplate(id: string) {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    reset({ appointmentId, diagnosis: t.diagnosis, notes: t.notes ?? "", lines: t.lines });
    toast.success(`Applied template "${t.name}".`);
  }

  function saveAsTemplate() {
    const name = window.prompt("Name this template (e.g. \"Hypertension starter\")");
    if (!name || name.trim().length < 2) return;
    const v = getValues();
    startSaveTpl(async () => {
      const res = await createRxTemplateAction({ name, diagnosis: v.diagnosis, notes: v.notes, lines: v.lines });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Saved as template.");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <input type="hidden" {...register("appointmentId")} />

      {templates.length > 0 && (
        <Field label="Start from a template">
          <select
            defaultValue=""
            onChange={(e) => { if (e.target.value) applyTemplate(e.target.value); e.target.value = ""; }}
            className="h-10 w-full rounded-md border border-ge-border bg-white px-3 text-sm"
          >
            <option value="">Choose a saved template…</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
      )}

      <Field label="Diagnosis" required error={errors.diagnosis?.message}>
        <Input placeholder="e.g. Essential hypertension" {...register("diagnosis")} />
      </Field>
      <Field label="Clinical notes" error={errors.notes?.message}>
        <Textarea rows={3} placeholder="Lifestyle advice, follow-up plan…" {...register("notes")} />
      </Field>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-ge-ink">Medications</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append({ drug: "", strength: "", frequency: "", durationDays: 7, notes: "" })}
          >
            <Plus className="h-3.5 w-3.5" /> Add line
          </Button>
        </div>
        {errors.lines?.message && <p className="text-xs text-ge-danger">{errors.lines.message}</p>}
        <ul className="space-y-3">
          {fields.map((f, i) => (
            <li key={f.id} className="rounded-md border border-ge-border bg-white p-3">
              <div className="grid gap-2 md:grid-cols-[1.4fr_1fr_1.2fr_120px_auto]">
                <Field label={i === 0 ? "Drug" : undefined}>
                  <Input placeholder="Atenolol" {...register(`lines.${i}.drug`)} />
                </Field>
                <Field label={i === 0 ? "Strength" : undefined}>
                  <Input placeholder="50mg" {...register(`lines.${i}.strength`)} />
                </Field>
                <Field label={i === 0 ? "Frequency" : undefined}>
                  <Input placeholder="OD after breakfast" {...register(`lines.${i}.frequency`)} />
                </Field>
                <Field label={i === 0 ? "Days" : undefined}>
                  <Input type="number" min={1} max={365} {...register(`lines.${i}.durationDays`, { valueAsNumber: true })} />
                </Field>
                <div className={i === 0 ? "self-end" : ""}>
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove" onClick={() => remove(i)} disabled={fields.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Field label="Notes (optional)">
                <Input placeholder="Take with food" {...register(`lines.${i}.notes`)} />
              </Field>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" loading={pending}>Save prescription</Button>
        <Button type="button" variant="secondary" loading={savingTpl} onClick={saveAsTemplate}>
          <Save className="h-3.5 w-3.5" /> Save as template
        </Button>
      </div>
    </form>
  );
}
