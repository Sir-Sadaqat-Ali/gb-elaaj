import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { PATIENT_NAV } from "@/app/(patient)/patient/_nav";
import { AssistantThread } from "@/components/ai/assistant-thread";

export const dynamic = "force-dynamic";

export const metadata = { title: "Aafiyat AI" };

export default async function AIAssistantPage() {
  const session = await requireRole("PATIENT");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { patient: true } });
  if (!me) return null;

  return (
    <AppShell
      navItems={PATIENT_NAV}
      user={{ name: me.name, role: "Patient", image: me.image }}
      title="Aafiyat AI"
      subtitle="General health guidance — never a substitute for professional medical advice."
    >
      <AssistantThread userName={me.name} />
    </AppShell>
  );
}
