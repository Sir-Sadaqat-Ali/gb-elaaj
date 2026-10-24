import Link from "next/link";
import { ExternalLink, Check, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { DOCTOR_NAV } from "@/app/(doctor)/doctor/_nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/brand/verified-badge";
import { Badge } from "@/components/ui/badge";
import { paisaToRupees } from "@/lib/formatting";
import { updateDoctorProfileAction } from "@/lib/actions/doctor-profile";
import { ProfilePhotoForm } from "@/components/settings/profile-photo-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Public profile" };

const LANGUAGE_HINT = "English, Urdu, Shina, Balti, Wakhi, Burushaski, Khowar, Pashto, Punjabi";

export default async function DoctorPublicProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await requireRole("DOCTOR");
  const [me, cities] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { doctor: { include: { specialties: { include: { specialty: true } }, city: true } } },
    }),
    prisma.city.findMany({ where: { active: true }, orderBy: { nameEn: "asc" } }),
  ]);
  if (!me?.doctor) return null;
  const d = me.doctor;
  const { saved } = await searchParams;

  return (
    <AppShell navItems={DOCTOR_NAV} user={{ name: me.name, role: "Doctor", image: me.image }} title="Public profile" subtitle="How patients see you on Gb Elaaj.">
      <div className="grid gap-4 md:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Avatar src={me.image} name={me.name} size={56} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-semibold text-ge-ink">{me.name}</h2>
                {d.verifiedStatus === "APPROVED" ? (
                  <VerifiedBadge size="sm" />
                ) : (
                  <Badge variant="warning">{d.verifiedStatus === "PENDING" ? "Verification pending" : "Not verified"}</Badge>
                )}
              </div>
              <div className="text-[12px] text-ge-primary">{d.specialties[0]?.specialty.nameEn}</div>
              <div className="text-[11px] text-ge-muted">PMDC {d.pmdcNumber} · /{d.slug}</div>
            </div>
          </div>

          <div className="mt-5 border-t border-ge-border pt-5">
            <ProfilePhotoForm name={me.name} image={me.image} />
          </div>

          {saved === "1" && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--ge-success-border)] bg-[color:var(--ge-success-bg)] px-3.5 py-1.5 text-[12.5px] font-medium text-[color:var(--ge-success)]">
              <Check className="h-3.5 w-3.5" /> Profile saved — changes are live.
            </div>
          )}
          {saved === "err" && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--ge-danger-border)] bg-[color:var(--ge-danger-bg)] px-3.5 py-1.5 text-[12.5px] font-medium text-[color:var(--ge-danger)]">
              <AlertCircle className="h-3.5 w-3.5" /> Couldn't save — please try again.
            </div>
          )}

          <form action={updateDoctorProfileAction} className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Display name (verified — contact support to change)"><Input defaultValue={me.name} disabled /></Field>
              <Field label="City">
                <select name="cityId" defaultValue={d.cityId} className="h-10 w-full rounded-md border border-ge-border bg-white px-3 text-sm">
                  {cities.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
                </select>
              </Field>
              <Field label="Qualifications"><Input name="qualifications" defaultValue={d.qualifications} placeholder="MBBS, FCPS" /></Field>
              <Field label="Years of experience"><Input name="experienceYears" type="number" min={0} max={70} defaultValue={d.experienceYears} /></Field>
              <Field label="Clinic / hospital"><Input name="clinic" defaultValue={d.clinic ?? ""} placeholder="e.g. DHQ Hospital Gilgit" /></Field>
              <Field label="Languages (comma-separated)"><Input name="languages" defaultValue={d.languages.join(", ")} placeholder={LANGUAGE_HINT} /></Field>
              <Field label="Video consult fee (PKR)"><Input name="consultFee" type="number" min={0} step={50} defaultValue={paisaToRupees(d.consultFeePaisa)} /></Field>
              <Field label="Clinic visit fee (PKR)"><Input name="clinicFee" type="number" min={0} step={50} defaultValue={paisaToRupees(d.clinicFeePaisa)} /></Field>
            </div>

            <Field label="Consultation modes">
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="inline-flex items-center gap-2 text-[13px] text-ge-ink">
                  <input type="checkbox" name="modes" value="VIDEO" defaultChecked={d.modes.includes("VIDEO")} className="h-4 w-4 accent-ge-primary" /> Video consult
                </label>
                <label className="inline-flex items-center gap-2 text-[13px] text-ge-ink">
                  <input type="checkbox" name="modes" value="CLINIC" defaultChecked={d.modes.includes("CLINIC")} className="h-4 w-4 accent-ge-primary" /> In-clinic visit
                </label>
              </div>
            </Field>

            <Field label="Bio (English)"><Textarea name="bioEn" defaultValue={d.bioEn} rows={4} /></Field>
            <Field label="Bio (Urdu — optional)"><Textarea name="bioUr" defaultValue={d.bioUr ?? ""} rows={3} /></Field>

            <label className="flex items-center gap-2 rounded-lg border border-ge-border bg-ge-soft-bg/50 px-3 py-2.5 text-[13px] text-ge-ink">
              <input type="checkbox" name="active" defaultChecked={d.active} className="h-4 w-4 accent-ge-primary" />
              Visible in search and accepting new bookings
            </label>

            <p className="text-[11.5px] text-ge-muted">
              Your name, PMDC number, and profile URL are locked to your verified identity. To change them, contact{" "}
              <a href="mailto:support@gbelaaj.pk" className="text-ge-primary hover:underline">support@gbelaaj.pk</a>.
            </p>
            <div className="flex justify-end"><Button type="submit">Save profile</Button></div>
          </form>
        </Card>

        <Card className="p-5">
          <h3 className="text-[13px] font-semibold text-ge-ink">View public profile</h3>
          <p className="mt-1 text-[11.5px] text-ge-muted">Open your profile as a patient sees it.</p>
          <Button asChild variant="secondary" size="sm" className="mt-3">
            <Link href={`/doctor/${d.slug}`} target="_blank">
              Open <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
          {!d.active && (
            <p className="mt-4 rounded-lg border border-[color:var(--ge-warning-border)] bg-[color:var(--ge-warning-bg)] p-2.5 text-[11.5px] text-[color:var(--ge-warning)]">
              You're currently hidden from search. Tick "Visible in search" and save to accept bookings.
            </p>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
