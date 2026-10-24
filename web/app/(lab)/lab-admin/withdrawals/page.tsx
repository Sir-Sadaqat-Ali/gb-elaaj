import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { LAB_NAV } from "@/app/(lab)/lab-admin/_nav";
import { WithdrawalPanel } from "@/components/booking/withdrawal-panel";
import { getProviderWithdrawalContext } from "@/lib/withdrawal-helpers";

export const metadata = { title: "Withdrawals" };
export const dynamic = "force-dynamic";

export default async function LabWithdrawalsPage() {
  const session = await requireRole("LAB_ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { labAdmin: true } });
  if (!me?.labAdmin) return null;
  const ctx = await getProviderWithdrawalContext(me.id, "LAB_ADMIN");
  if (!ctx) return null;
  return (
    <AppShell
      navItems={LAB_NAV}
      user={{ name: me.name, role: `Lab · ${me.labAdmin.name}`, image: me.image }}
      title="Withdrawals"
      subtitle="Request payouts from your earnings."
    >
      <WithdrawalPanel availablePaisa={ctx.available} withdrawals={ctx.withdrawals} />
    </AppShell>
  );
}
