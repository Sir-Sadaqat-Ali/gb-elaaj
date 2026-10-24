"use client";

import * as React from "react";
import { Check, Copy, Landmark } from "lucide-react";
import { toast } from "sonner";
import { bankTransfer } from "@/lib/payments/bank-transfer";
import { formatPkr } from "@/lib/formatting";

/**
 * Manual bank-transfer instructions shown at checkout while the automated
 * gateway is pending. Displays the account details with copy buttons and
 * tells the patient how to get their payment confirmed.
 */
export function BankTransferDetails({ amountPaisa }: { amountPaisa?: number }) {
  if (!bankTransfer.enabled) return null;

  return (
    <div className="rounded-lg border border-ge-primary/30 bg-ge-soft-bg p-4">
      <div className="flex items-center gap-2 text-[12.5px] font-semibold text-ge-navy">
        <Landmark className="h-4 w-4 text-ge-primary" />
        Transfer to this account
      </div>

      <div className="mt-3 space-y-1.5">
        <CopyRow label="Bank" value={bankTransfer.bankName} />
        <CopyRow label="Account title" value={bankTransfer.accountTitle} />
        <CopyRow label="Account number" value={bankTransfer.accountNumber} mono />
        {amountPaisa != null && amountPaisa > 0 && (
          <CopyRow label="Amount" value={formatPkr(amountPaisa)} copyText={String(Math.round(amountPaisa / 100))} />
        )}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-ge-muted">
        After transferring, your booking is reserved. Keep the receipt
        {bankTransfer.whatsapp ? (
          <> and send a screenshot on WhatsApp to <span className="font-semibold text-ge-ink">{bankTransfer.whatsapp}</span> to confirm faster.</>
        ) : (
          <> — our team will verify your payment and confirm your booking.</>
        )}
      </p>
    </div>
  );
}

function CopyRow({
  label,
  value,
  copyText,
  mono,
}: {
  label: string;
  value: string;
  copyText?: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyText ?? value);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy — please copy manually.");
    }
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11.5px] text-ge-muted">{label}</span>
      <button
        type="button"
        onClick={copy}
        className="group inline-flex items-center gap-1.5 text-right"
        aria-label={`Copy ${label}`}
      >
        <span className={`text-[12.5px] font-semibold text-ge-ink ${mono ? "ge-mono tracking-wide" : ""}`}>{value}</span>
        {copied ? (
          <Check className="h-3.5 w-3.5 text-ge-success" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-ge-muted group-hover:text-ge-primary" />
        )}
      </button>
    </div>
  );
}
