import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { FINANCE_NAV } from "@/app/(finance)/finance/_nav";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function FinanceNotificationsPage() {
  const session = await requireRole("FINANCE");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  return (
    <NotificationsView
      user={{ id: me.id, name: me.name, roleLabel: "Finance", image: me.image }}
      navItems={FINANCE_NAV}
      basePath="/finance/notifications"
      emptyBody="Withdrawal requests and finance events will show up here."
    />
  );
}
