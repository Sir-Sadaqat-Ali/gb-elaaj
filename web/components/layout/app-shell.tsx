import * as React from "react";
import { Sidebar, type NavItem } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { EmailVerifyBanner } from "@/components/layout/email-verify-banner";

export function AppShell({
  navItems,
  user,
  title,
  subtitle,
  actions,
  search,
  children,
}: {
  navItems: NavItem[];
  user: { name: string; role: string; image?: string | null };
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  search?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={navItems} user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          subtitle={subtitle}
          actions={actions}
          user={user}
          navItems={navItems}
          search={search}
        />
        <main id="main" className="flex-1 overflow-auto p-4 md:p-6">
          <EmailVerifyBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
