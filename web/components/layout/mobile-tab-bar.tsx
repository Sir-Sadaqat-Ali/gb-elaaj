"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, FileText, Home, Sparkles, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/patient/dashboard", label: "Home", icon: Home },
  { href: "/patient/appointments", label: "Visits", icon: Calendar },
  { href: "/patient/medical-records", label: "Records", icon: FileText },
  { href: "/patient/ai-assistant", label: "Aafiyat", icon: Sparkles },
  { href: "/patient/settings", label: "Me", icon: User },
];

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ge-border bg-white px-1 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex">
        {ITEMS.map((it) => {
          const active = pathname === it.href || pathname?.startsWith(it.href + "/");
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-2 text-[10.5px] font-medium",
                  active ? "text-ge-primary" : "text-ge-muted hover:text-ge-ink"
                )}
              >
                <it.icon className="h-4 w-4" aria-hidden />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
