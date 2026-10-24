import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-ge-soft-bg border-ge-border text-ge-muted",
        info: "bg-ge-primary/10 border-ge-primary/25 text-ge-primary",
        accent: "bg-ge-accent-bg border-ge-accent/25 text-ge-accent",
        success: "bg-[color:var(--ge-success-bg)] border-[color:var(--ge-success-border)] text-[color:var(--ge-success)]",
        warning: "bg-[color:var(--ge-warning-bg)] border-[color:var(--ge-warning-border)] text-[color:var(--ge-warning)]",
        danger: "bg-[color:var(--ge-danger-bg)] border-[color:var(--ge-danger-border)] text-[color:var(--ge-danger)]",
        navy: "bg-ge-navy/5 border-ge-navy/15 text-ge-navy",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
