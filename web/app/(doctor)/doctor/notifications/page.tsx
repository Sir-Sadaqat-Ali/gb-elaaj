import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { DOCTOR_NAV } from "@/app/(doctor)/doctor/_nav";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function DoctorNotificationsPage() {
  const session = await requireRole("DOCTOR");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  return (
    <NotificationsView
      user={{ id: me.id, name: me.name, roleLabel: "Doctor", image: me.image }}
      navItems={DOCTOR_NAV}
      basePath="/doctor/notifications"
      emptyBody="New bookings, reschedules, and cancellations will show up here."
    />
  );
}
