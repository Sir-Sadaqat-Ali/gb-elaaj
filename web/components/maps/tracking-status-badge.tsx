"use client";

import { Activity, AlertCircle, CheckCircle2, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrackingStatusBadgeProps = {
  status: "live" | "stale" | "offline" | "ended";
  ageSeconds?: number;
  className?: string;
};

function ageLabel(seconds: number) {
  if (seconds < 60) return `${seconds}s ago`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)} h ago`;
}

export function TrackingStatusBadge({ status, ageSeconds, className }: TrackingStatusBadgeProps) {
  const map = {
    live: {
      icon: Activity,
      bg: "bg-[color:var(--ge-success-bg)]",
      fg: "text-[color:var(--ge-success)]",
      label: "Live",
      sub: typeof ageSeconds === "number" ? `Updated ${ageLabel(ageSeconds)}` : undefined,
    },
    stale: {
      icon: AlertCircle,
      bg: "bg-[color:var(--ge-warning-bg)]",
      fg: "text-[color:var(--ge-warning)]",
      label: "Last seen",
      sub: typeof ageSeconds === "number" ? ageLabel(ageSeconds) : undefined,
    },
    offline: {
      icon: WifiOff,
      bg: "bg-ge-soft-bg",
      fg: "text-ge-muted",
      label: "Offline",
      sub: "No signal",
    },
    ended: {
      icon: CheckCircle2,
      bg: "bg-ge-soft-bg",
      fg: "text-ge-muted",
      label: "Visit ended",
      sub: undefined,
    },
  } as const;

  const m = map[status];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold",
        m.bg,
        m.fg,
        className,
      )}
    >
      <Icon
        className={cn("h-3 w-3", status === "live" && "animate-pulse")}
        aria-hidden
      />
      <span>
        {m.label}
        {m.sub && <span className="ml-1 font-normal opacity-80">· {m.sub}</span>}
      </span>
    </span>
  );
}
