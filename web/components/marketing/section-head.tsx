import * as React from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/marketing/bits";

export function SectionHead({
  eyebrow,
  title,
  subtitle,
  action,
  center,
  onDark,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  center?: boolean;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-10 gap-6",
        center
          ? "flex flex-col items-center text-center"
          : "flex flex-col items-start md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className={cn("max-w-[640px]", center && "mx-auto")}>
        {eyebrow && <div className="mb-4"><Eyebrow onDark={onDark}>{eyebrow}</Eyebrow></div>}
        <h2 className={cn("ge-display text-[30px] leading-[38px] md:text-[44px] md:leading-[54px]", onDark ? "text-white" : "text-ge-ink")}>
          {title}
        </h2>
        {subtitle && (
          <p className={cn("mt-3 text-[15.5px] leading-relaxed", onDark ? "text-white/70" : "text-ge-muted")}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
