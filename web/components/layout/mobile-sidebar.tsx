"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ICONS, type NavItem } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

export function MobileSidebar({
  items,
  user,
}: {
  items: NavItem[];
  user: { name: string; role: string; image?: string | null };
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pt-12">
        <div className="flex items-center gap-2.5 px-1">
          <Avatar src={user.image} name={user.name} size={36} />
          <div>
            <div className="text-[13px] font-semibold text-ge-ink">{user.name}</div>
            <div className="text-[11px] text-ge-muted">{user.role}</div>
          </div>
        </div>
        <nav className="mt-3 flex flex-col gap-0.5">
          {items.map((it, i) => {
            if (it.kind === "section") {
              return (
                <div key={`s-${i}`} className="px-2 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ge-muted">
                  {it.label}
                </div>
              );
            }
            const Icon = ICONS[it.icon];
            const active = pathname === it.href || pathname?.startsWith(it.href + "/");
            return (
              <Link
                key={it.id}
                href={it.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium",
                  active ? "bg-ge-soft-bg text-ge-primary" : "text-ge-ink hover:bg-ge-soft-bg"
                )}
              >
                <Icon className="h-4 w-4" /> {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-1">
          <Logo size={24} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
