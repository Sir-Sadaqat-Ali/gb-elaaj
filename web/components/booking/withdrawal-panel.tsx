"use client";

import * as React from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { requestWithdrawalAction } from "@/lib/actions/withdrawals";
import { formatPkr, formatDateTime, formatPkrCompact } from "@/lib/formatting";

type Wd = {
  id: string;
  amountPaisa: number;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  status: string;
  reason: string | null;
  createdAt: string;
};

export function WithdrawalPanel({
  availablePaisa,
  withdrawals,
}: {
  availablePaisa: number;
  withdrawals: Wd[];
}) {
  const [amount, setAmount] = React.useState<number>(0);
  const [bankName, setBankName] = React.useState("");
  const [accountTitle, setAccountTitle] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [pending, start] = React.useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const paisa = Math.round(amount * 100);
    start(async () => {
      const res = await requestWithdrawalAction({
        amountPaisa: paisa,
        bankName,
        accountTitle,
        accountNumber,
      });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Withdrawal requested.");
        setAmount(0);
      }
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
      <Card className="p-6">
        <div>
          <div className="text-[12px] font-medium text-ge-muted">Available to withdraw</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-ge-navy">{formatPkrCompact(availablePaisa)}</div>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <Field label="Amount (Rs.)" required hint="Minimum Rs. 500">
            <Input
              type="number"
              min={500}
              step={100}
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </Field>
          <Field label="Bank name" required>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Habib Bank Limited" />
          </Field>
          <Field label="Account title" required>
            <Input value={accountTitle} onChange={(e) => setAccountTitle(e.target.value)} placeholder="As printed on cheque" />
          </Field>
          <Field label="Account number / IBAN" required>
            <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="PK00HABB0000123456789" />
          </Field>
          <Button type="submit" loading={pending} disabled={amount * 100 > availablePaisa || amount < 500}>
            Request withdrawal
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="text-[14px] font-semibold text-ge-ink">Recent requests</h3>
        {withdrawals.length === 0 ? (
          <p className="mt-2 text-[12px] text-ge-muted">No requests yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ge-border">
            {withdrawals.map((w) => (
              <li key={w.id} className="py-3">
                <div className="flex items-center justify-between">
                  <span className="ge-mono text-[13px] font-semibold">{formatPkr(w.amountPaisa)}</span>
                  <StatusChip status={w.status as StatusKind} />
                </div>
                <div className="mt-0.5 text-[11px] text-ge-muted">
                  {w.bankName} · ****{w.accountNumber.slice(-4)} · {formatDateTime(new Date(w.createdAt))}
                </div>
                {w.reason && (
                  <div className="mt-1 text-[11.5px] text-[color:var(--ge-danger)]">{w.reason}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
