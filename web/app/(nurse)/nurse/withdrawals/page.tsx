import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { NURSE_NAV } from "@/app/(nurse)/nurse/_nav";
import { WithdrawalPanel } from "@/components/booking/withdrawal-panel";
import { getProviderWithdrawalContext } from "@/lib/withdrawal-helpers";

export const metadata = { title: "Withdrawals" };
export const dynamic = "force-dynamic";

export default async function NurseWithdrawalsPage() {
  const session = await requireRole("NURSE");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;
  const ctx = await getProviderWithdrawalContext(me.id, "NURSE");
  if (!ctx) return null;
  return (
    <AppShell
      navItems={NURSE_NAV}
      user={{ name: me.name, role: "Nurse", image: me.image }}
      title="Withdrawals"
      subtitle="Request payouts from your earnings."
    >
      <WithdrawalPanel availablePaisa={ctx.available} withdrawals={ctx.withdrawals} />
    </AppShell>
  );
}
