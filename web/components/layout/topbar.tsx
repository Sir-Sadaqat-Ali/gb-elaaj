import * as React from "react";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import type { NavItem } from "@/components/layout/sidebar";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

const NOTIF_HREF: Record<string, string> = {
  PATIENT: "/patient/notifications",
  DOCTOR: "/doctor/notifications",
  ADMIN: "/admin/notifications",
  FINANCE: "/finance/notifications",
  LAB_ADMIN: "/lab-admin/notifications",
  PHARMACY_ADMIN: "/pharmacy-admin/notifications",
  NURSE: "/nurse/notifications",
};

export async function TopBar({
  title,
  subtitle,
  actions,
  user,
  navItems,
  search,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  user: { name: string; role: string; image?: string | null };
  navItems: NavItem[];
  search?: string;
}) {
  // Live unread-notification count for the bell.
  let unread = 0;
  let bellHref: string | null = null;
  try {
    const session = await auth();
    if (session?.user) {
      unread = await prisma.notification.count({
        where: { userId: session.user.id, readAt: null },
      });
      bellHref = NOTIF_HREF[session.user.role] ?? null;
    }
  } catch {
    // best-effort; never block the topbar
  }

  const bellInner = (
    <span
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-ge-border bg-white",
        bellHref && "transition hover:border-ge-primary hover:text-ge-primary"
      )}
      aria-label={
        unread > 0 ? `Notifications (${unread} unread)` : "Notifications"
      }
    >
      <Bell className="h-4 w-4 text-ge-muted" />
      {unread > 0 && (
        <span
          className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-ge-danger px-1 text-[9.5px] font-semibold text-white"
          aria-hidden
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </span>
  );

  return (
    <div className="flex h-16 items-center gap-3 border-b border-ge-border bg-white px-4 md:px-6">
      <MobileSidebar items={navItems} user={user} />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[15px] font-semibold tracking-tight text-ge-ink">{title}</h1>
        {subtitle && <p className="truncate text-[11.5px] text-ge-muted">{subtitle}</p>}
      </div>
      {search && (
        <label className="hidden items-center gap-2 rounded-md border border-ge-border bg-ge-soft-bg px-3 py-1.5 md:flex md:min-w-[260px]">
          <Search className="h-3.5 w-3.5 text-ge-muted" />
          <input
            placeholder={search}
            aria-label="Search"
            className="bg-transparent text-[12.5px] placeholder:text-ge-muted focus:outline-none"
          />
        </label>
      )}
      {actions}
      {bellHref ? (
        <Link href={bellHref}>{bellInner}</Link>
      ) : (
        bellInner
      )}
      <div className="flex items-center gap-2 rounded-md border border-ge-border bg-white px-2 py-1">
        <Avatar src={user.image} name={user.name} size={28} />
        <span className="hidden text-[12.5px] font-medium text-ge-ink md:inline">{user.name.split(" ")[0]}</span>
        <SignOutButton />
      </div>
    </div>
  );
}
