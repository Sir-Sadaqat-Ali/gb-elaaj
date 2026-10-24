import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { DOCTOR_NAV } from "@/app/(doctor)/doctor/_nav";
import { WithdrawalPanel } from "@/components/booking/withdrawal-panel";
import { getProviderWithdrawalContext } from "@/lib/withdrawal-helpers";

export const metadata = { title: "Withdrawals" };
export const dynamic = "force-dynamic";

export default async function DoctorWithdrawalsPage() {
  const session = await requireRole("DOCTOR");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;
  const ctx = await getProviderWithdrawalContext(me.id, "DOCTOR");
  if (!ctx) return null;
  return (
    <AppShell
      navItems={DOCTOR_NAV}
      user={{ name: me.name, role: "Doctor", image: me.image }}
      title="Withdrawals"
      subtitle="Request payouts from your earnings."
    >
      <WithdrawalPanel availablePaisa={ctx.available} withdrawals={ctx.withdrawals} />
    </AppShell>
  );
}
