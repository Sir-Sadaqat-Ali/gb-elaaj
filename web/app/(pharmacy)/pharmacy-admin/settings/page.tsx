import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { PHARMACY_NAV } from "@/app/(pharmacy)/pharmacy-admin/_nav";
import { ProviderSettingsForm } from "@/components/settings/provider-settings-form";
import { updatePharmacyProfileAction } from "@/lib/actions/provider-profile";
import { Card } from "@/components/ui/card";
import { ProfilePhotoForm } from "@/components/settings/profile-photo-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pharmacy · Settings" };

export default async function PharmacySettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const session = await requireRole("PHARMACY_ADMIN");
  const [me, cities] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, include: { pharmacyAdmin: { include: { city: true } } } }),
    prisma.city.findMany({ where: { active: true }, orderBy: { nameEn: "asc" } }),
  ]);
  if (!me?.pharmacyAdmin) return null;
  const pharm = me.pharmacyAdmin;
  const { saved } = await searchParams;

  return (
    <AppShell navItems={PHARMACY_NAV} user={{ name: pharm.name, role: `${pharm.city.nameEn} · Pharmacy`, image: me.image }} title="Settings" subtitle="Your pharmacy's public details.">
      <Card className="mb-4 p-6">
        <h2 className="text-[14px] font-semibold text-ge-ink">Profile picture</h2>
        <p className="mt-1 text-[12px] text-ge-muted">Add a profile picture for your account.</p>
        <div className="mt-4"><ProfilePhotoForm name={me.name} image={me.image} /></div>
      </Card>
      <ProviderSettingsForm
        kind="Pharmacy"
        action={updatePharmacyProfileAction}
        entity={{ name: pharm.name, slug: pharm.slug, license: pharm.license, verified: pharm.verified, active: pharm.active, cityId: pharm.cityId }}
        cities={cities.map((c) => ({ id: c.id, nameEn: c.nameEn }))}
        saved={saved}
      />
    </AppShell>
  );
}
