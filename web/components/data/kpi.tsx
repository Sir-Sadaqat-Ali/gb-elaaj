import * as React from "react";
import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiProps = {
  label: string;
  value: React.ReactNode;
  delta?: string;
  deltaDir?: "up" | "down" | "flat";
  icon?: LucideIcon;
  hint?: string;
  className?: string;
};

export function Kpi({ label, value, delta, deltaDir = "up", icon: Icon, hint, className }: KpiProps) {
  const deltaColor =
    deltaDir === "up" ? "text-ge-success bg-[color:var(--ge-success-bg)]" :
    deltaDir === "down" ? "text-ge-danger bg-[color:var(--ge-danger-bg)]" :
    "text-ge-muted bg-ge-soft-bg";
  return (
    <div className={cn("ge-kpi", className)}>
      <div className="flex items-center gap-2 text-[12px] text-ge-muted">
        {Icon && <Icon className="h-3.5 w-3.5 text-ge-primary" aria-hidden />}
        <span className="font-medium">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="ge-mono text-2xl font-semibold tracking-tight text-ge-ink">{value}</span>
        {delta && (
          <span className={cn("inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-semibold", deltaColor)}>
            {deltaDir === "up" && <ArrowUp className="h-3 w-3" />}
            {deltaDir === "down" && <ArrowDown className="h-3 w-3" />}
            {delta}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-[11px] text-ge-muted">{hint}</p>}
    </div>
  );
}
