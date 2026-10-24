import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  size = 30,
  href = "/",
  withWordmark = true,
  dark = false,
  className,
}: {
  size?: number;
  href?: string | null;
  withWordmark?: boolean;
  dark?: boolean;
  className?: string;
}) {
  const ink = dark ? "#FFFFFF" : "#111827";
  const sub = dark ? "rgba(255,255,255,.55)" : "#5E6B7C";

  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden>
        <defs>
          <linearGradient id="gbBrand" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0B84FE" />
            <stop offset="100%" stopColor="#0A2540" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="32" height="32" rx="9" fill="url(#gbBrand)" />
        <path d="M16 11h4v5h5v4h-5v5h-4v-5h-5v-4h5v-5Z" fill="#fff" />
      </svg>
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span style={{ color: ink }} className="text-[16px] font-bold tracking-[-0.025em]">
            Gb<span className="text-ge-primary"> Elaaj</span>
          </span>
          <span style={{ color: sub }} className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.16em]">
            علاج · Care for All
          </span>
        </span>
      )}
    </span>
  );

  if (!href) return content;
  return <Link href={href} aria-label="Gb Elaaj home">{content}</Link>;
}
