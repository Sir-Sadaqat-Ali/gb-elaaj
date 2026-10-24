import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PHARMACY_NAV } from "@/app/(pharmacy)/pharmacy-admin/_nav";
import { WithdrawalPanel } from "@/components/booking/withdrawal-panel";
import { getProviderWithdrawalContext } from "@/lib/withdrawal-helpers";

export const metadata = { title: "Withdrawals" };
export const dynamic = "force-dynamic";

export default async function PharmacyWithdrawalsPage() {
  const session = await requireRole("PHARMACY_ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { pharmacyAdmin: true } });
  if (!me?.pharmacyAdmin) return null;
  const ctx = await getProviderWithdrawalContext(me.id, "PHARMACY_ADMIN");
  if (!ctx) return null;
  return (
    <AppShell
      navItems={PHARMACY_NAV}
      user={{ name: me.name, role: `Pharmacy · ${me.pharmacyAdmin.name}`, image: me.image }}
      title="Withdrawals"
      subtitle="Request payouts from your earnings."
    >
      <WithdrawalPanel availablePaisa={ctx.available} withdrawals={ctx.withdrawals} />
    </AppShell>
  );
}
