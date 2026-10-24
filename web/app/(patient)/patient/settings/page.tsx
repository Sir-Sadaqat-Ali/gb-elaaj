import { Check, AlertCircle } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { PATIENT_NAV } from "@/app/(patient)/patient/_nav";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updatePatientProfileAction, changePasswordAction, deleteMyAccountAction } from "@/lib/actions/account";
import { Download } from "lucide-react";
import { ProfilePhotoForm } from "@/components/settings/profile-photo-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

const PW_MESSAGES: Record<string, { tone: "ok" | "err"; text: string }> = {
  ok: { tone: "ok", text: "Password updated." },
  short: { tone: "err", text: "New password must be at least 8 characters." },
  mismatch: { tone: "err", text: "New password and confirmation don't match." },
  wrong: { tone: "err", text: "Your current password is incorrect." },
  nopass: { tone: "err", text: "No password is set on this account." },
};

function Banner({ tone, children }: { tone: "ok" | "err"; children: React.ReactNode }) {
  const ok = tone === "ok";
  return (
    <div
      className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium ${
        ok
          ? "border-[color:var(--ge-success-border)] bg-[color:var(--ge-success-bg)] text-[color:var(--ge-success)]"
          : "border-[color:var(--ge-danger-border)] bg-[color:var(--ge-danger-bg)] text-[color:var(--ge-danger)]"
      }`}
    >
      {ok ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
      {children}
    </div>
  );
}

export default async function PatientSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string; pw?: string; del?: string }>;
}) {
  const session = await requireRole("PATIENT");
  const [me, cities] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, include: { patient: { include: { city: true } } } }),
    prisma.city.findMany({ where: { active: true }, orderBy: { nameEn: "asc" } }),
  ]);
  if (!me) return null;
  const p = me.patient;
  const { profile, pw, del } = await searchParams;
  const pwMsg = pw ? PW_MESSAGES[pw] : null;
  const delMsg = del === "wrong" ? "That password is incorrect." : del === "nopass" ? "No password is set on this account." : null;
  const dobValue = p?.dob ? new Date(p.dob).toISOString().slice(0, 10) : "";

  return (
    <AppShell navItems={PATIENT_NAV} user={{ name: me.name, role: "Patient", image: me.image }} title="Settings" subtitle="Profile, security, and preferences.">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Profile */}
        <Card className="p-6">
          <h2 className="text-[14px] font-semibold text-ge-ink">Profile</h2>
          {profile === "ok" && <div className="mt-3"><Banner tone="ok">Profile saved.</Banner></div>}
          {profile === "err" && <div className="mt-3"><Banner tone="err">Couldn't save — that phone may already be in use.</Banner></div>}
          <form action={updatePatientProfileAction} className="mt-4 space-y-4">
            <Field label="Full name"><Input name="name" defaultValue={me.name} required /></Field>
            <Field label="Email (login — cannot change here)"><Input defaultValue={me.email ?? ""} disabled /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone"><Input name="phone" defaultValue={me.phone ?? ""} placeholder="03XXXXXXXXX" /></Field>
              <Field label="Blood type"><Input name="bloodType" defaultValue={p?.bloodType ?? ""} placeholder="O+" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gender">
                <select name="gender" defaultValue={p?.gender ?? ""} className="h-10 w-full rounded-md border border-ge-border bg-white px-3 text-sm">
                  <option value="">—</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>
              <Field label="Date of birth"><Input name="dob" type="date" defaultValue={dobValue} /></Field>
            </div>
            <Field label="City">
              <select name="cityId" defaultValue={p?.cityId ?? ""} className="h-10 w-full rounded-md border border-ge-border bg-white px-3 text-sm">
                <option value="">—</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
              </select>
            </Field>
            <Field label="Address"><Input name="addressLine" defaultValue={p?.addressLine ?? ""} placeholder="House, street, area" /></Field>
            <div className="flex justify-end"><Button type="submit">Save profile</Button></div>
          </form>
        </Card>

        {/* Profile picture */}
        <Card className="p-6">
          <h2 className="text-[14px] font-semibold text-ge-ink">Profile picture</h2>
          <p className="mt-1 text-[12px] text-ge-muted">Add a photo so doctors and care teams can recognise you.</p>
          <div className="mt-4">
            <ProfilePhotoForm name={me.name} image={me.image} />
          </div>
        </Card>

        {/* Security */}
        <Card className="p-6">
          <h2 className="text-[14px] font-semibold text-ge-ink">Change password</h2>
          {pwMsg && <div className="mt-3"><Banner tone={pwMsg.tone}>{pwMsg.text}</Banner></div>}
          <form action={changePasswordAction} className="mt-4 space-y-4">
            <input type="hidden" name="redirectTo" value="/patient/settings" />
            <Field label="Current password"><Input name="currentPassword" type="password" required autoComplete="current-password" /></Field>
            <Field label="New password"><Input name="newPassword" type="password" required minLength={8} autoComplete="new-password" /></Field>
            <Field label="Confirm new password"><Input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" /></Field>
            <p className="text-[11.5px] text-ge-muted">At least 8 characters. You'll stay signed in on this device.</p>
            <div className="flex justify-end"><Button type="submit" variant="secondary">Update password</Button></div>
          </form>
        </Card>

        {/* Data export */}
        <Card className="p-6">
          <h2 className="text-[14px] font-semibold text-ge-ink">Your data</h2>
          <p className="mt-1 text-[12px] text-ge-muted">Download a copy of everything on your account — profile, appointments, records, orders, and reviews — as a JSON file.</p>
          <div className="mt-4">
            <Button asChild variant="secondary">
              <a href="/api/patient/export" download><Download className="h-4 w-4" /> Export my data</a>
            </Button>
          </div>
        </Card>

        {/* Danger zone */}
        <Card className="border-[color:var(--ge-danger-border)] p-6">
          <h2 className="text-[14px] font-semibold text-[color:var(--ge-danger)]">Delete account</h2>
          <p className="mt-1 text-[12px] text-ge-muted">
            This removes your personal details and signs you out permanently. For medical and payment record-keeping,
            anonymized transaction history is retained as required by law. This can&apos;t be undone.
          </p>
          {delMsg && <div className="mt-3"><Banner tone="err">{delMsg}</Banner></div>}
          <form action={deleteMyAccountAction} className="mt-4 space-y-3">
            <Field label="Confirm your password to delete"><Input name="password" type="password" required autoComplete="current-password" /></Field>
            <div className="flex justify-end"><Button type="submit" variant="destructive">Delete my account</Button></div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
