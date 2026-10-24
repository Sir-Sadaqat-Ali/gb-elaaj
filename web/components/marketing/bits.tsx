import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared marketing primitives — one visual language across every section.
 * The blue-gradient rounded-square icon tile is the signature (Curenast).
 */

export function IconTile({
  icon: Icon,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = { sm: "h-11 w-11 rounded-xl", md: "h-14 w-14 rounded-2xl", lg: "h-16 w-16 rounded-2xl" }[size];
  const icons = { sm: "h-5 w-5", md: "h-6 w-6", lg: "h-7 w-7" }[size];
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center bg-gradient-to-br from-ge-primary to-ge-navy text-white shadow-[0_8px_20px_-8px_rgba(11,132,254,.5)]",
        dims,
        className
      )}
    >
      <Icon className={icons} />
    </span>
  );
}

export function Eyebrow({ children, onDark }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[13px] font-medium",
        onDark ? "border-white/20 bg-white/10 text-white" : "border-ge-border bg-white text-ge-ink"
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-ge-primary" aria-hidden />
      {children}
    </span>
  );
}

/** Concentric decorative rings for blue/navy sections. */
export function Rings({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" />
      <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="absolute left-1/2 top-1/2 h-[740px] w-[740px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[.06]" />
    </div>
  );
}

/** Small blue arrow-in-circle used on "Explore" links. */
export function ArrowChip() {
  return (
    <span className="grid h-6 w-6 place-items-center rounded-full bg-ge-primary text-white transition-transform group-hover:translate-x-0.5">
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M3 8h9M8 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
