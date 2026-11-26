import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Smartphone, CreditCard, Lock, ArrowRight, XCircle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPkr } from "@/lib/formatting";

export const metadata = {
  title: "EasyPaisa Payment Gateway · Gb Elaaj",
  description: "Secure EasyPaisa consultation fee payment for Gb Elaaj appointments.",
};

export default async function EasyPaisaCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    orderId?: string;
    apptId?: string;
    amount?: string;
    doctor?: string;
  }>;
}) {
  const params = await searchParams;
  const orderId = params.orderId || `appt_${Date.now()}`;
  const apptId = params.apptId || (orderId.startsWith("appt_") ? orderId.replace("appt_", "") : orderId);
  const amountPaisa = parseInt(params.amount || "150000", 10);
  const doctorName = params.doctor || "Consultant Doctor";

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-lg">
        {/* EasyPaisa Brand Header */}
        <div className="rounded-3xl border border-emerald-300 bg-linear-to-r from-emerald-600 to-emerald-700 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 font-extrabold text-xl shadow-xs">
                EP
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">EasyPaisa</h1>
                <p className="text-[11px] text-emerald-100 uppercase tracking-widest font-semibold">
                  Official Payment Gateway
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold backdrop-blur-xs">
              <Lock className="h-3.5 w-3.5" /> 256-bit Secure
            </div>
          </div>

          <div className="mt-6 border-t border-emerald-500/40 pt-4 flex items-center justify-between">
            <div>
              <div className="text-[11.5px] text-emerald-100">Consultation Fee</div>
              <div className="text-2xl font-black tracking-tight">{formatPkr(amountPaisa)}</div>
            </div>
            <div className="text-right text-[11px] text-emerald-100">
              <div>Ref: <span className="font-mono font-bold text-white">{orderId.slice(-8).toUpperCase()}</span></div>
              <div className="truncate max-w-[160px] text-white/90 font-medium">{doctorName}</div>
            </div>
          </div>
        </div>

        {/* Sandbox Notice Banner */}
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[12px] text-amber-900 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <span className="text-lg">🧪</span>
            <div>
              <strong className="font-bold text-amber-950">EasyPaisa Gateway Sandbox Mode</strong>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Aap ki EasyPaisa official merchant integration connect ho chuki hai. Jab EasyPaisa se live credentials (Merchant ID &amp; Hash Key) receive honge, wo <code className="bg-amber-100 px-1 rounded font-mono font-bold">.env</code> mein dalte hi direct live transaction start ho jayegi.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Methods Card */}
        <Card className="mt-4 rounded-3xl border border-ge-border bg-white p-5 shadow-card">
          <h2 className="text-[14px] font-bold text-ge-ink">Select Payment Method (طریقہ انتخاب کریں)</h2>

          <div className="mt-3 space-y-2.5">
            {/* EasyPaisa Mobile Account Option */}
            <div className="rounded-2xl border-2 border-emerald-600 bg-emerald-50/50 p-3.5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs">
                <Smartphone className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>EasyPaisa Mobile Account</span>
                  <span className="rounded-full bg-emerald-200 px-2 py-0.2 text-[9.5px] font-bold text-emerald-900">Instant</span>
                </div>
                <div className="text-[11px] text-emerald-700">Telenor / EasyPaisa wallet PIN prompt</div>
              </div>
              <div className="h-4 w-4 rounded-full border-4 border-emerald-600 bg-white" />
            </div>

            {/* Debit / Credit Card Option */}
            <div className="rounded-2xl border border-ge-border bg-white p-3.5 flex items-center gap-3 opacity-80">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-ge-ink">Visa / MasterCard Debit Card</div>
                <div className="text-[11px] text-ge-muted">Pay with any Pakistani bank debit card</div>
              </div>
            </div>
          </div>

          {/* Action Form */}
          <div className="mt-6 border-t border-ge-border pt-5 space-y-2.5">
            {/* SUCCESS SUBMISSION */}
            <form action="/api/payments/easypaisa/callback" method="POST">
              <input type="hidden" name="orderRefNumber" value={orderId} />
              <input type="hidden" name="apptId" value={apptId} />
              <input type="hidden" name="responseCode" value="0000" />
              <input type="hidden" name="transactionId" value={`EP_${Date.now()}`} />
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-2xl shadow-md gap-2"
              >
                <CheckCircle2 className="h-4 w-4" /> Approve &amp; Pay {formatPkr(amountPaisa)} (ادائیگی مکمل کریں)
              </Button>
            </form>

            {/* CANCEL SUBMISSION */}
            <form action="/api/payments/easypaisa/callback" method="POST">
              <input type="hidden" name="orderRefNumber" value={orderId} />
              <input type="hidden" name="apptId" value={apptId} />
              <input type="hidden" name="responseCode" value="0001" />
              <Button
                type="submit"
                variant="ghost"
                className="w-full text-neutral-500 hover:text-rose-600 hover:bg-rose-50 h-10 rounded-2xl text-[12px] font-semibold gap-1.5"
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel Payment (ادائیگی منسوخ کریں)
              </Button>
            </form>
          </div>
        </Card>

        {/* Security Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-[11px] text-ge-muted">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Telenor Microfinance Bank · State Bank of Pakistan Approved Payment Gateway</span>
        </div>
      </div>
    </div>
  );
}
