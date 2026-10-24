import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { ADMIN_NAV } from "@/app/(admin)/admin/_nav";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const session = await requireRole("ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  return (
    <NotificationsView
      user={{ id: me.id, name: me.name, roleLabel: "Admin", image: me.image }}
      navItems={ADMIN_NAV}
      basePath="/admin/notifications"
      emptyBody="Home-care requests, verifications, and platform events will show up here."
    />
  );
}
