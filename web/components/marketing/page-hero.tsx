import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Eyebrow } from "@/components/marketing/bits";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  chips,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  chips?: { icon: LucideIcon; label: string }[];
}) {
  return (
    <section className="bg-ge-blue-tint">
      <div className="ge-container py-12 md:py-16">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="ge-display mt-4 max-w-3xl text-[34px] leading-[42px] text-ge-ink md:text-[50px] md:leading-[58px]">
          {title}
        </h1>
        {subtitle && <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-ge-muted">{subtitle}</p>}
        {chips && chips.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-2.5">
            {chips.map((c) => (
              <span key={c.label} className="inline-flex items-center gap-2 rounded-full border border-ge-border bg-white px-4 py-2 text-[12.5px] font-medium text-ge-ink">
                <c.icon className="h-3.5 w-3.5 text-ge-primary" />
                {c.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
