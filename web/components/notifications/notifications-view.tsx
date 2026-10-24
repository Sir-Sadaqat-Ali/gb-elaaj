import { Bell } from "lucide-react";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import type { NavItem } from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/data/empty-state";
import { NotificationItem, MarkAllReadButton } from "@/components/booking/notifications-controls";
import { relativeTime, formatDateTime } from "@/lib/formatting";

/**
 * Shared notifications screen used by every role. Notifications carry no role
 * column — they're scoped by userId — so the only per-role inputs are the
 * sidebar nav, the display label, and the route path (for revalidation + the
 * mark-read wiring).
 */
export async function NotificationsView({
  user,
  navItems,
  basePath,
  emptyBody = "When your bookings, orders, and account updates arrive, they'll appear here.",
}: {
  user: { id: string; name: string; roleLabel: string; image?: string | null };
  navItems: NavItem[];
  basePath: string;
  emptyBody?: string;
}) {
  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = items.filter((n) => !n.readAt).length;

  return (
    <AppShell
      navItems={navItems}
      user={{ name: user.name, role: user.roleLabel, image: user.image }}
      title="Notifications"
      subtitle={`${unreadCount} unread · ${items.length} total`}
      actions={unreadCount > 0 ? <MarkAllReadButton basePath={basePath} /> : undefined}
    >
      {items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" body={emptyBody} />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-ge-border">
            {items.map((n) => (
              <NotificationItem
                key={n.id}
                id={n.id}
                title={n.title}
                body={n.body}
                href={n.href}
                basePath={basePath}
                relativeTime={relativeTime(n.createdAt)}
                createdAtIso={n.createdAt.toISOString()}
                createdAtAbsolute={formatDateTime(n.createdAt)}
                read={!!n.readAt}
              />
            ))}
          </ul>
        </Card>
      )}
    </AppShell>
  );
}
