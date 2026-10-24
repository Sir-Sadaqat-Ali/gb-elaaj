"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updatePharmacyOrderStatusAction } from "@/lib/actions/pharmacy";

const NEXT: Record<string, string[]> = {
  PENDING_RX_REVIEW: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKING", "CANCELLED"],
  PACKING: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

const LABELS: Record<string, string> = {
  CONFIRMED: "Confirm",
  PACKING: "Mark packing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Mark delivered",
  CANCELLED: "Cancel",
};

export function OrderStatusActions({ orderId, current }: { orderId: string; current: string }) {
  const [pending, start] = React.useTransition();
  const options = NEXT[current] ?? [];
  if (options.length === 0) {
    return <p className="text-[12px] text-ge-muted">No more transitions.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((s) => (
        <Button
          key={s}
          size="sm"
          variant={s === "CANCELLED" ? "destructive-outline" : s === current ? "ghost" : "primary"}
          loading={pending}
          onClick={() =>
            start(async () => {
              const res = await updatePharmacyOrderStatusAction({
                orderId,
                status: s as Parameters<typeof updatePharmacyOrderStatusAction>[0]["status"],
              });
              if (!res.ok) toast.error(res.error);
              else toast.success(`Order is now ${s.toLowerCase().replaceAll("_", " ")}.`);
            })
          }
        >
          {LABELS[s] ?? s}
        </Button>
      ))}
    </div>
  );
}
