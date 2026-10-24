"use client";

import * as React from "react";
import { Activity, Clock, Heart, Syringe } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestHomeCareAction } from "@/lib/actions/home-care";
import { BankTransferDetails } from "@/components/booking/bank-transfer-details";
import { formatPkr } from "@/lib/formatting";

const SERVICES = [
  { name: "IV antibiotics", icon: Syringe, durationMin: 60, pricePaisa: 350000 },
  { name: "Wound dressing", icon: Activity, durationMin: 45, pricePaisa: 250000 },
  { name: "Elderly care", icon: Heart, durationMin: 240, pricePaisa: 750000 },
  { name: "Physiotherapy", icon: Activity, durationMin: 60, pricePaisa: 400000 },
  { name: "Post-op care", icon: Heart, durationMin: 90, pricePaisa: 450000 },
  { name: "Diabetes care", icon: Activity, durationMin: 45, pricePaisa: 280000 },
];

export function HomeCareRequestForm({ defaultAddress }: { defaultAddress: string }) {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [serviceName, setServiceName] = React.useState(SERVICES[0].name);
  const svc = SERVICES.find((s) => s.name === serviceName) ?? SERVICES[0];
  const [scheduledFor, setScheduledFor] = React.useState(toLocalDatetime(tomorrow));
  const [duration, setDuration] = React.useState(svc.durationMin);
  const [address, setAddress] = React.useState(defaultAddress);
  const [description, setDescription] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<"bank_transfer" | "wallet">("bank_transfer");
  const [pending, start] = React.useTransition();

  React.useEffect(() => {
    setDuration(svc.durationMin);
  }, [svc.durationMin]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return toast.error("Add the visit address.");
    start(async () => {
      const res = await requestHomeCareAction({
        serviceName,
        description: description || undefined,
        scheduledFor: new Date(scheduledFor).toISOString(),
        durationMin: duration,
        addressLine: address,
        pricePaisa: svc.pricePaisa,
        paymentMethod,
      });
      if (res && !res.ok) toast.error(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Service" required>
        <div className="grid gap-2 md:grid-cols-2">
          {SERVICES.map((s) => (
            <button
              type="button"
              key={s.name}
              onClick={() => setServiceName(s.name)}
              aria-pressed={serviceName === s.name}
              className={`flex items-center gap-2.5 rounded-md border p-3 text-left text-[12.5px] ${
                serviceName === s.name ? "border-ge-primary bg-ge-soft-bg text-ge-primary" : "border-ge-border bg-white text-ge-ink"
              }`}
            >
              <s.icon className="h-4 w-4" />
              <span className="flex-1">
                <span className="block font-semibold">{s.name}</span>
                <span className="block text-[10.5px] text-ge-muted">{s.durationMin} min · {formatPkr(s.pricePaisa)}</span>
              </span>
            </button>
          ))}
        </div>
      </Field>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="When" required>
          <Input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
        </Field>
        <Field label="Duration (min)" required>
          <Input type="number" min={30} max={480} step={15} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </Field>
      </div>
      <Field label="Address" required>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House 14, Sector C, Gilgit" />
      </Field>
      <Field label="Notes for the nurse">
        <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mobility limited; please ring the upper bell." />
      </Field>
      <Field label="Payment method">
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as "bank_transfer" | "wallet")}
          className="h-10 w-full rounded-md border border-ge-border bg-white px-3 text-sm"
        >
          <option value="bank_transfer">Bank Transfer (HBL)</option>
          <option value="wallet">Cash on visit</option>
        </select>
      </Field>
      {paymentMethod === "bank_transfer" && (
        <BankTransferDetails amountPaisa={svc.pricePaisa} />
      )}
      <div className="flex items-center justify-between border-t border-ge-border pt-3">
        <span className="text-[12.5px] text-ge-muted">Total · <Clock className="inline h-3 w-3" /> {duration} min</span>
        <span className="ge-mono text-base font-semibold text-ge-navy">{formatPkr(svc.pricePaisa)}</span>
      </div>
      <Button type="submit" loading={pending}>Request visit</Button>
    </form>
  );
}

function toLocalDatetime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
