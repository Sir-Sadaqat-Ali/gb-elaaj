"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Calendar, Users, FileText, Beaker, Pill, Heart, Stethoscope,
  Wallet, Settings, ShieldCheck, Truck, Layers, MapPin, BarChart3, ClipboardList,
  Sparkles, Activity, Clock, Video, Bell, Search, type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export type NavItem =
  | { kind: "section"; label: string }
  | { kind: "link"; id: string; href: string; label: string; icon: keyof typeof ICONS; badge?: number };

export const ICONS = {
  Home, Calendar, Users, FileText, Beaker, Pill, Heart, Stethoscope,
  Wallet, Settings, ShieldCheck, Truck, Layers, MapPin, BarChart3, ClipboardList,
  Sparkles, Activity, Clock, Video, Bell, Search,
};

export function Sidebar({
  items,
  user,
}: {
  items: NavItem[];
  user: { name: string; role: string; image?: string | null };
}) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col gap-3 border-r border-ge-border bg-white px-3 py-5">
      <div className="px-2 pb-1">
        <Logo size={28} />
      </div>
      <nav className="flex flex-col gap-0.5" aria-label="Sidebar">
        {items.map((it, i) => {
          if (it.kind === "section") {
            return (
              <div
                key={`s-${i}`}
                className="px-2 pb-1.5 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ge-muted"
              >
                {it.label}
              </div>
            );
          }
          const Icon: LucideIcon = ICONS[it.icon];
          const active = pathname === it.href || pathname?.startsWith(it.href + "/");
          return (
            <Link
              key={it.id}
              href={it.href}
              data-active={active || undefined}
              className="ge-nav-item"
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span className="flex-1">{it.label}</span>
              {it.badge ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    active ? "bg-ge-primary text-white" : "border border-ge-border bg-ge-soft-bg text-ge-muted"
                  )}
                >
                  {it.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-lg border border-ge-border p-2.5">
        <div className="flex items-center gap-2.5">
          <Avatar src={user.image} name={user.name} size={32} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-semibold text-ge-ink">{user.name}</div>
            <div className="truncate text-[10.5px] text-ge-muted">{user.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
