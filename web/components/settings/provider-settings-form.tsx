import { Check, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Shared lab/pharmacy storefront editor. `action` is a server action passed in
 * from the role's settings page. Only name/city/active are editable; license,
 * slug, and verification are admin-managed and shown read-only.
 */
export function ProviderSettingsForm({
  kind,
  action,
  entity,
  cities,
  saved,
}: {
  kind: "Lab" | "Pharmacy";
  action: (formData: FormData) => Promise<void>;
  entity: { name: string; slug: string; license: string; verified: boolean; active: boolean; cityId: string };
  cities: { id: string; nameEn: string }[];
  saved?: string;
}) {
  const work = kind === "Lab" ? "bookings" : "orders";
  return (
    <Card className="max-w-2xl p-6">
      <div className="flex items-center gap-2">
        <h2 className="text-[15px] font-semibold text-ge-ink">{kind} profile</h2>
        {entity.verified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Pending verification</Badge>}
      </div>

      {saved === "1" && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--ge-success-border)] bg-[color:var(--ge-success-bg)] px-3.5 py-1.5 text-[12.5px] font-medium text-[color:var(--ge-success)]">
          <Check className="h-3.5 w-3.5" /> Saved.
        </div>
      )}
      {saved === "err" && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--ge-danger-border)] bg-[color:var(--ge-danger-bg)] px-3.5 py-1.5 text-[12.5px] font-medium text-[color:var(--ge-danger)]">
          <AlertCircle className="h-3.5 w-3.5" /> Couldn&apos;t save — please try again.
        </div>
      )}

      <form action={action} className="mt-4 space-y-4">
        <Field label={`${kind} name`}><Input name="name" defaultValue={entity.name} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="License (locked)"><Input defaultValue={entity.license} disabled /></Field>
          <Field label="Profile URL (locked)"><Input defaultValue={`/${entity.slug}`} disabled /></Field>
        </div>
        <Field label="City">
          <select name="cityId" defaultValue={entity.cityId} className="h-10 w-full rounded-md border border-ge-border bg-white px-3 text-sm">
            {cities.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
          </select>
        </Field>
        <label className="flex items-center gap-2 rounded-lg border border-ge-border bg-ge-soft-bg/50 px-3 py-2.5 text-[13px] text-ge-ink">
          <input type="checkbox" name="active" defaultChecked={entity.active} className="h-4 w-4 accent-ge-primary" />
          Visible in search and accepting {work}
        </label>
        <p className="text-[11.5px] text-ge-muted">
          Your license and verification status are managed by Gb Elaaj admin. Contact{" "}
          <a href="mailto:support@gbelaaj.pk" className="text-ge-primary hover:underline">support@gbelaaj.pk</a> to change them.
        </p>
        <div className="flex justify-end"><Button type="submit">Save changes</Button></div>
      </form>
    </Card>
  );
}
