"use client";

import * as React from "react";
import Link from "next/link";
import { Minus, Pill, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { UploadField, type UploadResult } from "@/components/uploads/upload-field";
import { createPharmacyOrderAction } from "@/lib/actions/pharmacy";
import { BankTransferDetails } from "@/components/booking/bank-transfer-details";
import { formatPkr, formatDate } from "@/lib/formatting";

type Med = {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyCity: string;
  nameGeneric: string;
  nameBrand: string | null;
  strength: string | null;
  pricePaisa: number;
  mrpPaisa: number;
  rxRequired: boolean;
  stock: number;
};

type Order = {
  id: string;
  status: string;
  totalPaisa: number;
  createdAt: string;
};

const DELIVERY_PAISA = 15_000;

export function PharmacyShop({
  meds,
  defaultAddress,
  defaultCity,
  recentOrders,
  initialCart,
  reorderNotice,
}: {
  meds: Med[];
  defaultAddress: string;
  defaultCity: string;
  recentOrders: Order[];
  initialCart?: Record<string, number>;
  reorderNotice?: string[];
}) {
  const [cart, setCart] = React.useState<Record<string, number>>(initialCart ?? {});
  const [address, setAddress] = React.useState(defaultAddress);
  const [city, setCity] = React.useState(defaultCity);
  const [rxUpload, setRxUpload] = React.useState<UploadResult | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState<"bank_transfer" | "wallet">("bank_transfer");
  const [pending, start] = React.useTransition();

  const cartItems = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => {
      const m = meds.find((x) => x.id === id)!;
      return { ...m, qty };
    });
  const subtotal = cartItems.reduce((acc, it) => acc + it.pricePaisa * it.qty, 0);
  const total = cartItems.length ? subtotal + DELIVERY_PAISA : 0;
  const requiresRx = cartItems.some((it) => it.rxRequired);
  const cartPharmacyIds = new Set(cartItems.map((it) => it.pharmacyId));
  const multiPharmacy = cartPharmacyIds.size > 1;

  function setQty(id: string, qty: number) {
    setCart((c) => ({ ...c, [id]: Math.max(0, qty) }));
  }

  function checkout() {
    if (cartItems.length === 0) return toast.error("Your cart is empty.");
    if (multiPharmacy) return toast.error("Cart must come from a single pharmacy.");
    if (!address.trim() || !city.trim()) return toast.error("Add your delivery address.");
    if (requiresRx && !rxUpload?.fileKey) return toast.error("Some items require a prescription. Upload your Rx PDF or photo.");
    start(async () => {
      const res = await createPharmacyOrderAction({
        items: cartItems.map((it) => ({ medicineId: it.id, qty: it.qty })),
        addressLine: address,
        cityName: city,
        prescriptionKey: rxUpload?.fileKey || null,
        prescriptionMime: (rxUpload?.fileMime as "application/pdf" | "image/png" | "image/jpeg" | "image/webp" | undefined) || null,
        prescriptionSize: rxUpload?.fileSize || null,
        paymentMethod,
      });
      if (res && !res.ok) toast.error(res.error);
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {meds.map((m) => (
            <Card key={m.id} className="flex flex-col p-4">
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ge-soft-bg text-ge-primary">
                  <Pill className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-ge-ink">{m.nameBrand ?? m.nameGeneric}</div>
                  <div className="text-[11px] text-ge-muted">
                    {m.nameGeneric} {m.strength ? `· ${m.strength}` : ""}
                  </div>
                  <div className="text-[10.5px] text-ge-muted">{m.pharmacyName} · {m.pharmacyCity}</div>
                </div>
                {m.rxRequired && <Badge variant="warning">Rx</Badge>}
              </div>
              <div className="mt-3 flex items-end justify-between border-t border-ge-border pt-2">
                <div>
                  <span className="ge-mono text-[14px] font-semibold text-ge-ink">{formatPkr(m.pricePaisa)}</span>
                  {m.mrpPaisa > m.pricePaisa && (
                    <span className="ml-1.5 text-[11px] text-ge-muted line-through">{formatPkr(m.mrpPaisa)}</span>
                  )}
                </div>
                <Quantity qty={cart[m.id] ?? 0} max={m.stock} setQty={(q) => setQty(m.id, q)} />
              </div>
            </Card>
          ))}
        </div>
      </div>

      <aside className="space-y-3 md:sticky md:top-20 md:self-start">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-ge-primary" />
            <h3 className="text-[14px] font-semibold text-ge-ink">Your cart</h3>
            <span className="ml-auto text-[11px] text-ge-muted">{cartItems.length} item{cartItems.length === 1 ? "" : "s"}</span>
          </div>
          {reorderNotice && reorderNotice.length > 0 && (
            <p className="mt-3 rounded-md bg-[color:var(--ge-warning-bg)] p-2 text-[11.5px] text-[color:var(--ge-warning)]">
              Couldn&apos;t re-add: {reorderNotice.join(", ")} — out of stock or discontinued.
            </p>
          )}
          {cartItems.length === 0 ? (
            <p className="mt-3 text-[12.5px] text-ge-muted">No items yet — add medicines from the list.</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {cartItems.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-ge-ink">{it.nameBrand ?? it.nameGeneric}</div>
                    <div className="text-[10.5px] text-ge-muted">{it.qty} × {formatPkr(it.pricePaisa)}</div>
                  </div>
                  <span className="ge-mono">{formatPkr(it.pricePaisa * it.qty)}</span>
                  <button onClick={() => setQty(it.id, 0)} className="text-ge-muted hover:text-ge-danger" aria-label="Remove">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {multiPharmacy && (
            <p className="mt-2 rounded-md bg-[color:var(--ge-warning-bg)] p-2 text-[11.5px] text-[color:var(--ge-warning)]">
              You have items from multiple pharmacies. Please pick one.
            </p>
          )}

          <Field label="Delivery address" className="mt-4">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House 14, Sector C" />
          </Field>
          <Field label="City">
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Gilgit" />
          </Field>
          {requiresRx && (
            <div className="mt-3">
              <UploadField
                category="prescription"
                label="Prescription"
                hint="Upload a clear photo or PDF of your doctor's prescription. Max 5 MB. Pharmacy admin will review before dispatch."
                value={rxUpload && rxUpload.fileKey ? rxUpload : null}
                onUploaded={(r) => setRxUpload(r.fileKey ? r : null)}
              />
            </div>
          )}

          <div className="mt-3 space-y-1 text-[12px]">
            <Row label="Subtotal" value={formatPkr(subtotal)} />
            <Row label="Delivery" value={formatPkr(DELIVERY_PAISA)} />
            <div className="my-2 h-px bg-ge-border" />
            <Row label="Total" value={<span className="text-base font-semibold text-ge-navy">{formatPkr(total)}</span>} />
          </div>

          <Field label="Payment method" className="mt-3">
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as "bank_transfer" | "wallet")}
              className="h-10 w-full rounded-md border border-ge-border bg-white px-3 text-sm"
            >
              <option value="bank_transfer">Bank Transfer (HBL)</option>
              <option value="wallet">Cash on delivery</option>
            </select>
          </Field>
          {paymentMethod === "bank_transfer" && (
            <div className="mt-3">
              <BankTransferDetails amountPaisa={total} />
            </div>
          )}

          <Button className="mt-4 w-full" loading={pending} onClick={checkout} disabled={cartItems.length === 0}>
            Place order
          </Button>
        </Card>

        {recentOrders.length > 0 && (
          <Card className="p-5">
            <h3 className="text-[13px] font-semibold text-ge-ink">Recent orders</h3>
            <ul className="mt-2 divide-y divide-ge-border">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 py-2 text-[12.5px]">
                  <Link href={`/patient/pharmacy/orders/${o.id}`} className="flex-1 hover:text-ge-primary">
                    <span className="ge-mono">#{o.id.slice(-6).toUpperCase()}</span>
                    <span className="ml-1 text-ge-muted">· {formatDate(new Date(o.createdAt))}</span>
                  </Link>
                  <StatusChip status={o.status as StatusKind} />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </aside>
    </div>
  );
}

function Quantity({ qty, max, setQty }: { qty: number; max: number; setQty: (q: number) => void }) {
  return qty === 0 ? (
    <Button size="sm" variant="secondary" onClick={() => setQty(1)} disabled={max === 0}>
      Add
    </Button>
  ) : (
    <div className="inline-flex items-center rounded-md border border-ge-border bg-white">
      <button onClick={() => setQty(qty - 1)} aria-label="Decrease" className="flex h-7 w-7 items-center justify-center text-ge-muted">
        <Minus className="h-3 w-3" />
      </button>
      <span className="ge-mono w-7 text-center text-[12.5px] font-semibold">{qty}</span>
      <button onClick={() => setQty(Math.min(max, qty + 1))} aria-label="Increase" className="flex h-7 w-7 items-center justify-center text-ge-muted">
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ge-muted">{label}</span>
      <span className="ge-mono text-ge-ink">{value}</span>
    </div>
  );
}
