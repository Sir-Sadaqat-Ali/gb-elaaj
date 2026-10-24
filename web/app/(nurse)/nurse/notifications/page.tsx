import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { NURSE_NAV } from "@/app/(nurse)/nurse/_nav";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NurseNotificationsPage() {
  const session = await requireRole("NURSE");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  return (
    <NotificationsView
      user={{ id: me.id, name: me.name, roleLabel: "Nurse", image: me.image }}
      navItems={NURSE_NAV}
      basePath="/nurse/notifications"
      emptyBody="New home-care assignments and visit updates will show up here."
    />
  );
}
