"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Building, Check, Landmark, Lock, Stethoscope, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { toast } from "sonner";
import { bookAppointmentAction } from "@/lib/actions/appointments";
import { BankTransferDetails } from "@/components/booking/bank-transfer-details";
import { formatPkr, formatDate, formatTime } from "@/lib/formatting";

type Slot = { id: string; startsAt: string; mode: "VIDEO" | "CLINIC" };

const STEPS = ["Type", "Schedule", "Symptoms", "Confirm"] as const;

export function BookingFlow({
  doctorSlug,
  doctorName,
  videoFeePaisa,
  clinicFeePaisa,
  availability,
  preSelectSlotId,
}: {
  doctorSlug: string;
  doctorName: string;
  videoFeePaisa: number;
  clinicFeePaisa: number;
  availability: Slot[];
  preSelectSlotId: string | null;
}) {
  const initialSlot = preSelectSlotId
    ? availability.find((s) => s.id === preSelectSlotId) ?? null
    : availability[0] ?? null;

  const [step, setStep] = React.useState(0);
  const [mode, setMode] = React.useState<"VIDEO" | "CLINIC">(initialSlot?.mode ?? "VIDEO");
  const [slotId, setSlotId] = React.useState<string | null>(initialSlot?.id ?? null);
  const [symptoms, setSymptoms] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<"bank_transfer" | "wallet">("bank_transfer");
  const [pending, start] = React.useTransition();

  const fee = mode === "VIDEO" ? videoFeePaisa : clinicFeePaisa || videoFeePaisa;
  const slotsForMode = availability.filter((s) => s.mode === mode);
  const grouped = React.useMemo(() => groupByDay(slotsForMode), [slotsForMode]);
  const selectedSlot = availability.find((s) => s.id === slotId) ?? null;

  function next() {
    if (step === 0 && slotsForMode.length === 0) {
      toast.error(`No ${mode === "VIDEO" ? "video" : "clinic"} slots available. Try the other mode.`);
      return;
    }
    if (step === 1 && !slotId) {
      toast.error("Pick a slot first.");
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function submit() {
    if (!slotId) return toast.error("Pick a slot first.");
    start(async () => {
      const res = await bookAppointmentAction({
        doctorSlug,
        slotId,
        symptoms: symptoms || undefined,
        paymentMethod,
      });
      if (res && !res.ok) toast.error(res.error);
      // success: server action redirects; we won't get here
    });
  }

  return (
    <div>
      {/* Stepper */}
      <ol className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <li className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
                  i < step ? "bg-ge-success text-white" : i === step ? "bg-ge-primary text-white" : "border border-ge-border bg-white text-ge-muted"
                }`}
              >
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className={`text-[12.5px] ${i <= step ? "font-semibold text-ge-ink" : "text-ge-muted"}`}>{label}</span>
            </li>
            {i < STEPS.length - 1 && <span className={`h-0.5 flex-1 ${i < step ? "bg-ge-success" : "bg-ge-border"}`} />}
          </React.Fragment>
        ))}
      </ol>

      <Card className="rounded-3xl p-6 md:p-7">
        {step === 0 && (
          <ChooseMode
            mode={mode}
            setMode={(m) => {
              setMode(m);
              const first = availability.find((s) => s.mode === m);
              setSlotId(first?.id ?? null);
            }}
            videoFeePaisa={videoFeePaisa}
            clinicFeePaisa={clinicFeePaisa}
            videoCount={availability.filter((s) => s.mode === "VIDEO").length}
            clinicCount={availability.filter((s) => s.mode === "CLINIC").length}
          />
        )}
        {step === 1 && (
          <ChooseSlot doctorName={doctorName} grouped={grouped} slotId={slotId} setSlotId={setSlotId} />
        )}
        {step === 2 && (
          <Symptoms symptoms={symptoms} setSymptoms={setSymptoms} />
        )}
        {step === 3 && (
          <Confirm
            doctorName={doctorName}
            fee={fee}
            selectedSlot={selectedSlot}
            mode={mode}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            symptoms={symptoms}
          />
        )}
      </Card>

      <div className="mt-4 flex justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0 || pending}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} disabled={pending}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={submit} loading={pending}>
            Pay & confirm <Lock className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function ChooseMode({
  mode, setMode, videoFeePaisa, clinicFeePaisa, videoCount, clinicCount,
}: {
  mode: "VIDEO" | "CLINIC";
  setMode: (m: "VIDEO" | "CLINIC") => void;
  videoFeePaisa: number;
  clinicFeePaisa: number;
  videoCount: number;
  clinicCount: number;
}) {
  return (
    <div>
      <h2 className="ge-display text-[22px] font-semibold text-ge-navy">How would you like to consult?</h2>
      <p className="mt-1 text-[13px] text-ge-muted">Choose the format that works best for you.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("VIDEO")}
          disabled={videoCount === 0}
          aria-pressed={mode === "VIDEO"}
          className={`rounded-2xl border-2 p-5 text-left disabled:cursor-not-allowed disabled:opacity-50 ${
            mode === "VIDEO" ? "border-ge-primary bg-ge-blue-tint" : "border-ge-border bg-white hover:border-ge-primary/40"
          }`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ge-blue-tint text-ge-primary">
            <Video className="h-5 w-5" />
          </span>
          <div className="mt-3 text-[15px] font-semibold text-ge-ink">Video consultation</div>
          <div className="mt-1 text-[12.5px] text-ge-muted">From the comfort of home, 20-minute slots.</div>
          <div className="mt-3 text-[14px] font-semibold text-ge-primary">{formatPkr(videoFeePaisa)}</div>
          <div className="mt-0.5 text-[10.5px] text-ge-muted">{videoCount} slot{videoCount === 1 ? "" : "s"} available</div>
        </button>

        <button
          type="button"
          onClick={() => setMode("CLINIC")}
          disabled={clinicCount === 0 || clinicFeePaisa === 0}
          aria-pressed={mode === "CLINIC"}
          className={`rounded-2xl border-2 p-5 text-left disabled:cursor-not-allowed disabled:opacity-50 ${
            mode === "CLINIC" ? "border-ge-primary bg-ge-blue-tint" : "border-ge-border bg-white hover:border-ge-primary/40"
          }`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ge-blue-tint text-ge-primary">
            <Building className="h-5 w-5" />
          </span>
          <div className="mt-3 text-[15px] font-semibold text-ge-ink">Clinic visit</div>
          <div className="mt-1 text-[12.5px] text-ge-muted">In-person at the clinic.</div>
          <div className="mt-3 text-[14px] font-semibold text-ge-primary">
            {clinicFeePaisa > 0 ? formatPkr(clinicFeePaisa) : "Not offered"}
          </div>
          <div className="mt-0.5 text-[10.5px] text-ge-muted">{clinicCount} slot{clinicCount === 1 ? "" : "s"} available</div>
        </button>
      </div>
    </div>
  );
}

function ChooseSlot({
  doctorName, grouped, slotId, setSlotId,
}: {
  doctorName: string;
  grouped: { day: string; slots: Slot[] }[];
  slotId: string | null;
  setSlotId: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="ge-display text-[22px] font-semibold text-ge-navy">Pick a date and time</h2>
      <p className="mt-1 text-[13px] text-ge-muted">Live availability for {doctorName} · updated just now.</p>
      {grouped.length === 0 ? (
        <p className="mt-5 text-sm text-ge-muted">No upcoming slots. Please check back tomorrow.</p>
      ) : (
        <div className="mt-5 space-y-5">
          {grouped.map((g) => (
            <div key={g.day}>
              <div className="mb-2 text-[12px] font-semibold text-ge-navy">{g.day}</div>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                {g.slots.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setSlotId(s.id)}
                    aria-pressed={slotId === s.id}
                    className={`rounded-full border px-2.5 py-2 text-[12px] font-medium ${
                      slotId === s.id ? "border-ge-primary bg-ge-primary text-white" : "border-ge-border bg-white text-ge-ink hover:border-ge-primary"
                    }`}
                  >
                    {formatTime(new Date(s.startsAt))}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Symptoms({ symptoms, setSymptoms }: { symptoms: string; setSymptoms: React.Dispatch<React.SetStateAction<string>> }) {
  const quick = ["Chest pain", "Shortness of breath", "High BP", "Palpitations", "Headache", "Fatigue", "Cough", "Fever"];
  return (
    <div>
      <h2 className="ge-display text-[22px] font-semibold text-ge-navy">Tell the doctor what's going on</h2>
      <p className="mt-1 text-[13px] text-ge-muted">This helps the doctor prepare.</p>
      <div className="mt-5">
        <Field label="Symptoms or reason for visit">
          <Textarea
            rows={4}
            placeholder="e.g. Chest tightness, occasional dizziness for past 5 days. Currently on Atenolol 50mg."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
        </Field>
      </div>
      <div className="mt-3">
        <div className="mb-2 text-[11.5px] font-semibold text-ge-navy">Quick add</div>
        <div className="flex flex-wrap gap-1.5">
          {quick.map((q) => (
            <button
              type="button"
              key={q}
              onClick={() => setSymptoms((s) => (s ? `${s}, ${q.toLowerCase()}` : q))}
              className="rounded-full border border-ge-border bg-white px-3 py-1 text-[11.5px] font-medium text-ge-muted hover:text-ge-primary"
            >
              + {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Confirm({
  doctorName, fee, selectedSlot, mode, paymentMethod, setPaymentMethod, symptoms,
}: {
  doctorName: string;
  fee: number;
  selectedSlot: Slot | null;
  mode: "VIDEO" | "CLINIC";
  paymentMethod: "bank_transfer" | "wallet";
  setPaymentMethod: (m: "bank_transfer" | "wallet") => void;
  symptoms: string;
}) {
  return (
    <div>
      <h2 className="ge-display text-[22px] font-semibold text-ge-navy">Confirm and pay</h2>
      <p className="mt-1 text-[13px] text-ge-muted">Review the details below.</p>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-ge-border bg-ge-blue-tint p-4 text-[13px]">
          <Row label="Doctor" value={doctorName} />
          <Row label="Type" value={mode === "VIDEO" ? "Video consultation" : "Clinic visit"} />
          <Row label="When" value={selectedSlot ? `${formatDate(new Date(selectedSlot.startsAt))} · ${formatTime(new Date(selectedSlot.startsAt))}` : "—"} />
          <Row label="Symptoms" value={symptoms || "—"} />
          <div className="my-3 h-px bg-ge-border" />
          <Row label="Total" value={<span className="text-base font-semibold text-ge-navy">{formatPkr(fee)}</span>} />
        </div>
        <div>
          <div className="mb-2 text-[12px] font-semibold text-ge-navy">Payment method</div>
          <div className="space-y-1.5">
            {([
              { id: "bank_transfer", icon: Landmark, label: "Bank Transfer (HBL)", sub: "Direct transfer · recommended" },
              { id: "wallet", icon: Stethoscope, label: "Pay later (clinic)", sub: "On-site at the clinic" },
            ] as const).map((p) => (
              <label
                key={p.id}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 ${
                  paymentMethod === p.id ? "border-ge-primary bg-ge-blue-tint" : "border-ge-border bg-white"
                }`}
              >
                <input type="radio" name="pay" checked={paymentMethod === p.id} onChange={() => setPaymentMethod(p.id)} className="accent-ge-primary" />
                <p.icon className="h-4 w-4 text-ge-primary" />
                <span className="flex-1">
                  <span className="block text-[12.5px] font-semibold text-ge-ink">{p.label}</span>
                  <span className="block text-[10.5px] text-ge-muted">{p.sub}</span>
                </span>
              </label>
            ))}
          </div>
          {paymentMethod === "bank_transfer" && (
            <div className="mt-3">
              <BankTransferDetails amountPaisa={fee} />
            </div>
          )}
          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-ge-muted">
            <Lock className="h-3 w-3" /> Transfer the total to the account shown, then confirm. Your booking is reserved while we verify payment.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-ge-muted">{label}</span>
      <span className="font-medium text-ge-ink">{value}</span>
    </div>
  );
}

function groupByDay(slots: Slot[]): { day: string; slots: Slot[] }[] {
  const map = new Map<string, Slot[]>();
  for (const s of slots) {
    const key = formatDate(new Date(s.startsAt));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries()).map(([day, slots]) => ({ day, slots }));
}
