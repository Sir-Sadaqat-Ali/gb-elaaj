import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { LAB_NAV } from "@/app/(lab)/lab-admin/_nav";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function LabNotificationsPage() {
  const session = await requireRole("LAB_ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  return (
    <NotificationsView
      user={{ id: me.id, name: me.name, roleLabel: "Lab", image: me.image }}
      navItems={LAB_NAV}
      basePath="/lab-admin/notifications"
      emptyBody="New test bookings and report requests will show up here."
    />
  );
}
