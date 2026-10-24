import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { PATIENT_NAV } from "@/app/(patient)/patient/_nav";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function PatientNotificationsPage() {
  const session = await requireRole("PATIENT");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  return (
    <NotificationsView
      user={{ id: me.id, name: me.name, roleLabel: "Patient", image: me.image }}
      navItems={PATIENT_NAV}
      basePath="/patient/notifications"
      emptyBody="When your appointments confirm, lab reports arrive, or orders ship, they'll appear here."
    />
  );
}
