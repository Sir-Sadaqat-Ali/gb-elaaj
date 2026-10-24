import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { LAB_NAV } from "@/app/(lab)/lab-admin/_nav";
import { ProviderSettingsForm } from "@/components/settings/provider-settings-form";
import { updateLabProfileAction } from "@/lib/actions/provider-profile";
import { Card } from "@/components/ui/card";
import { ProfilePhotoForm } from "@/components/settings/profile-photo-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lab · Settings" };

export default async function LabSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const session = await requireRole("LAB_ADMIN");
  const [me, cities] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, include: { labAdmin: { include: { city: true } } } }),
    prisma.city.findMany({ where: { active: true }, orderBy: { nameEn: "asc" } }),
  ]);
  if (!me?.labAdmin) return null;
  const lab = me.labAdmin;
  const { saved } = await searchParams;

  return (
    <AppShell navItems={LAB_NAV} user={{ name: lab.name, role: `${lab.city.nameEn} · Lab`, image: me.image }} title="Settings" subtitle="Your lab's public details.">
      <Card className="mb-4 p-6">
        <h2 className="text-[14px] font-semibold text-ge-ink">Profile picture</h2>
        <p className="mt-1 text-[12px] text-ge-muted">Add a profile picture for your account.</p>
        <div className="mt-4"><ProfilePhotoForm name={me.name} image={me.image} /></div>
      </Card>
      <ProviderSettingsForm
        kind="Lab"
        action={updateLabProfileAction}
        entity={{ name: lab.name, slug: lab.slug, license: lab.license, verified: lab.verified, active: lab.active, cityId: lab.cityId }}
        cities={cities.map((c) => ({ id: c.id, nameEn: c.nameEn }))}
        saved={saved}
      />
    </AppShell>
  );
}
