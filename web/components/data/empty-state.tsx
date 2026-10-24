import * as React from "react";
import { LucideIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "first-time" | "no-result" | "error" | "no-permission";
  className?: string;
};

export function EmptyState({
  icon: Icon = Search,
  title,
  body,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      data-variant={variant}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-ge-border bg-white p-10 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ge-soft-bg text-ge-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-ge-ink">{title}</h3>
      {body && <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-ge-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
