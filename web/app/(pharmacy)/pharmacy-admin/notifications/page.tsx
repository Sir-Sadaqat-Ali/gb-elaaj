import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { PHARMACY_NAV } from "@/app/(pharmacy)/pharmacy-admin/_nav";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function PharmacyNotificationsPage() {
  const session = await requireRole("PHARMACY_ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  return (
    <NotificationsView
      user={{ id: me.id, name: me.name, roleLabel: "Pharmacy", image: me.image }}
      navItems={PHARMACY_NAV}
      basePath="/pharmacy-admin/notifications"
      emptyBody="New orders and prescription reviews will show up here."
    />
  );
}
