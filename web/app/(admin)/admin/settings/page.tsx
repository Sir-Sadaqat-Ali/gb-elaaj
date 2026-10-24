import { Check } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_NAV } from "@/app/(admin)/admin/_nav";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updatePlatformSettingsAction } from "@/lib/actions/admin";
import { ProfilePhotoForm } from "@/components/settings/profile-photo-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Platform settings" };

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await requireRole("ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  const settings = await prisma.platformSetting.findUnique({ where: { id: "singleton" } });
  const { saved } = await searchParams;
  if (!me) return null;
  const ovr = (settings?.commissionOverrides as Record<string, number> | null) ?? {};

  return (
    <AppShell navItems={ADMIN_NAV} user={{ name: me.name, role: "Super Admin", image: me.image }} title="Platform settings" subtitle="Commission, currency, slot rhythm, support contact.">
      {saved === "1" && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--ge-success-border)] bg-[color:var(--ge-success-bg)] px-4 py-2 text-[13px] font-medium text-[color:var(--ge-success)]">
          <Check className="h-4 w-4" /> Settings saved.
        </div>
      )}
      <Card className="mb-4 p-6">
        <h2 className="text-[14px] font-semibold text-ge-ink">Profile picture</h2>
        <p className="mt-1 text-[12px] text-ge-muted">Add a profile picture for your account.</p>
        <div className="mt-4"><ProfilePhotoForm name={me.name} image={me.image} /></div>
      </Card>
      <form action={updatePlatformSettingsAction}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-[14px] font-semibold text-ge-ink">Commission</h2>
            <p className="mt-1 text-[12px] text-ge-muted">Rates in basis points. 1500 = 15%.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="Default rate (bps)"><Input name="commissionBps" type="number" min={0} defaultValue={String(settings?.commissionBps ?? 1500)} /></Field>
              <Field label="Currency"><Input name="currency" defaultValue={settings?.currency ?? "PKR"} /></Field>
              <Field label="Override · CONSULTATION"><Input name="ovr_CONSULTATION" type="number" min={0} defaultValue={String(ovr.CONSULTATION ?? settings?.commissionBps ?? 1500)} /></Field>
              <Field label="Override · PHARMACY"><Input name="ovr_PHARMACY" type="number" min={0} defaultValue={String(ovr.PHARMACY ?? 800)} /></Field>
              <Field label="Override · LAB"><Input name="ovr_LAB" type="number" min={0} defaultValue={String(ovr.LAB ?? 1200)} /></Field>
              <Field label="Override · HOME_CARE"><Input name="ovr_HOME_CARE" type="number" min={0} defaultValue={String(ovr.HOME_CARE ?? 1500)} /></Field>
            </div>
            <p className="mt-3 text-[11.5px] text-ge-muted">
              Every change is recorded in the audit log.
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="text-[14px] font-semibold text-ge-ink">Operations</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="Slot duration (min)"><Input name="slotMinutes" type="number" min={5} defaultValue={String(settings?.slotMinutes ?? 20)} /></Field>
              <Field label="Reminder hours"><Input name="reminderHoursBefore" type="number" min={0} defaultValue={String(settings?.reminderHoursBefore ?? 2)} /></Field>
              <Field label="Support email"><Input name="supportEmail" type="email" defaultValue={settings?.supportEmail ?? ""} /></Field>
              <Field label="Support phone"><Input name="supportPhone" defaultValue={settings?.supportPhone ?? ""} /></Field>
            </div>
          </Card>
        </div>
        <div className="mt-5 flex justify-end">
          <Button type="submit" size="lg">Save settings</Button>
        </div>
      </form>
    </AppShell>
  );
}
