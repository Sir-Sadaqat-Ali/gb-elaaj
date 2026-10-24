import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type StatusKind =
  | "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
  | "PENDING_RX_REVIEW" | "PACKING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "REFUNDED"
  | "BOOKED" | "COLLECTED" | "PROCESSING" | "REPORTED"
  | "REQUESTED" | "ASSIGNED" | "EN_ROUTE" | "IN_VISIT"
  | "APPROVED" | "REJECTED" | "PAID" | "HOLD"
  | "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED";

const STATUS_MAP: Record<StatusKind, { label: string; variant: "neutral" | "info" | "success" | "warning" | "danger" | "navy" }> = {
  // appointments
  PENDING: { label: "Pending", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "info" },
  IN_PROGRESS: { label: "In progress", variant: "info" },
  COMPLETED: { label: "Completed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
  NO_SHOW: { label: "No-show", variant: "danger" },
  // pharmacy orders
  PENDING_RX_REVIEW: { label: "Rx review", variant: "warning" },
  PACKING: { label: "Packing", variant: "warning" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", variant: "info" },
  DELIVERED: { label: "Delivered", variant: "success" },
  REFUNDED: { label: "Refunded", variant: "neutral" },
  // lab
  BOOKED: { label: "Booked", variant: "info" },
  COLLECTED: { label: "Collected", variant: "info" },
  PROCESSING: { label: "Processing", variant: "warning" },
  REPORTED: { label: "Reported", variant: "success" },
  // home care
  REQUESTED: { label: "Requested", variant: "warning" },
  ASSIGNED: { label: "Assigned", variant: "info" },
  EN_ROUTE: { label: "En route", variant: "info" },
  IN_VISIT: { label: "In visit", variant: "info" },
  // withdrawals / verification
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "danger" },
  PAID: { label: "Paid", variant: "success" },
  HOLD: { label: "On hold", variant: "warning" },
  // user
  ACTIVE: { label: "Active", variant: "success" },
  PENDING_VERIFICATION: { label: "Pending verification", variant: "warning" },
  SUSPENDED: { label: "Suspended", variant: "danger" },
};

export function StatusChip({ status, className }: { status: StatusKind; className?: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, variant: "neutral" };
  return (
    <Badge variant={cfg.variant} className={cn("uppercase tracking-wider text-[10px]", className)}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {cfg.label}
    </Badge>
  );
}
