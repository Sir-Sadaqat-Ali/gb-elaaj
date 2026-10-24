"use client";

import * as React from "react";
import { Beaker, Clock } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { bookLabTestAction } from "@/lib/actions/labs";
import { BankTransferDetails } from "@/components/booking/bank-transfer-details";
import { formatPkr } from "@/lib/formatting";

type Test = {
  id: string;
  slug: string;
  nameEn: string;
  labName: string;
  city: string;
  sampleType: string;
  turnaroundHrs: number;
  fastingRequired: boolean;
  homeEligible: boolean;
  pricePaisa: number;
};

export function LabBookingForm({ tests, defaultAddress }: { tests: Test[]; defaultAddress: string }) {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<"HOME" | "WALK_IN">("HOME");
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [scheduledFor, setScheduledFor] = React.useState(toLocalDatetime(tomorrow));
  const [address, setAddress] = React.useState(defaultAddress);
  const [paymentMethod, setPaymentMethod] = React.useState<"bank_transfer" | "wallet">("bank_transfer");
  const [pending, start] = React.useTransition();

  const test = tests.find((t) => t.id === selected) ?? null;

  function submit() {
    if (!test) return toast.error("Pick a test first.");
    if (mode === "HOME" && !test.homeEligible) return toast.error("Home collection isn't available for this test.");
    if (mode === "HOME" && !address.trim()) return toast.error("Add your collection address.");
    start(async () => {
      const res = await bookLabTestAction({
        testId: test.id,
        scheduledFor: new Date(scheduledFor).toISOString(),
        mode,
        addressLine: mode === "HOME" ? address : undefined,
        paymentMethod,
      });
      if (res && !res.ok) toast.error(res.error);
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1.6fr_1fr]">
      <div>
        <h2 className="text-[14px] font-semibold text-ge-ink">Pick a test</h2>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {tests.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setSelected(t.id)}
                aria-pressed={selected === t.id}
                className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left ${
                  selected === t.id ? "border-ge-primary bg-ge-soft-bg" : "border-ge-border bg-white hover:border-ge-primary/40"
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ge-soft-bg text-ge-primary">
                  <Beaker className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-ge-ink">{t.nameEn}</div>
                  <div className="text-[11px] text-ge-muted">{t.labName} · {t.city}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ge-muted">
                    <Clock className="h-3 w-3" /> {t.turnaroundHrs}h
                    {t.homeEligible && <Badge variant="info">Home</Badge>}
                    {t.fastingRequired && <Badge variant="warning">Fasting</Badge>}
                  </div>
                </div>
                <span className="ge-mono text-[13px] font-semibold">{formatPkr(t.pricePaisa)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Card className="p-5 md:sticky md:top-20 md:self-start">
        <h3 className="text-[14px] font-semibold text-ge-ink">Booking details</h3>
        <div className="mt-4 space-y-3">
          <Field label="Mode">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("HOME")}
                aria-pressed={mode === "HOME"}
                disabled={!!test && !test.homeEligible}
                className={`flex-1 rounded-md border px-3 py-2 text-[12.5px] font-medium ${
                  mode === "HOME" ? "border-ge-primary bg-ge-primary/10 text-ge-primary" : "border-ge-border text-ge-ink"
                }`}
              >
                Home collection
              </button>
              <button
                type="button"
                onClick={() => setMode("WALK_IN")}
                aria-pressed={mode === "WALK_IN"}
                className={`flex-1 rounded-md border px-3 py-2 text-[12.5px] font-medium ${
                  mode === "WALK_IN" ? "border-ge-primary bg-ge-primary/10 text-ge-primary" : "border-ge-border text-ge-ink"
                }`}
              >
                Walk in
              </button>
            </div>
          </Field>
          <Field label="When">
            <Input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
          </Field>
          {mode === "HOME" && (
            <Field label="Collection address" required>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House 14, Sector C" />
            </Field>
          )}
          <Field label="Payment method">
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as "bank_transfer" | "wallet")}
              className="h-10 w-full rounded-md border border-ge-border bg-white px-3 text-sm"
            >
              <option value="bank_transfer">Bank Transfer (HBL)</option>
              <option value="wallet">Pay at lab</option>
            </select>
          </Field>
          {paymentMethod === "bank_transfer" && (
            <BankTransferDetails amountPaisa={test?.pricePaisa} />
          )}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-ge-border pt-3 text-[13px]">
          <span className="text-ge-muted">Total</span>
          <span className="ge-mono font-semibold text-ge-navy">{test ? formatPkr(test.pricePaisa) : "—"}</span>
        </div>
        <Button className="mt-3 w-full" loading={pending} disabled={!test} onClick={submit}>
          Book test
        </Button>
      </Card>
    </div>
  );
}

function toLocalDatetime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
