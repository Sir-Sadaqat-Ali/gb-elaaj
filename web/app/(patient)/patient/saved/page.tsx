import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { PATIENT_NAV } from "@/app/(patient)/patient/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/data/empty-state";
import { SaveDoctorButton } from "@/components/doctors/save-doctor-button";
import { formatPkr } from "@/lib/formatting";

export const dynamic = "force-dynamic";
export const metadata = { title: "Saved doctors" };

export default async function SavedDoctorsPage() {
  const session = await requireRole("PATIENT");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { patient: true } });
  if (!me?.patient) return null;

  const saved = await prisma.savedDoctor
    .findMany({
      where: { patientId: me.patient.id },
      orderBy: { createdAt: "desc" },
      include: { doctor: { include: { user: true, city: true, specialties: { include: { specialty: true } } } } },
    })
    .catch(() => []); // SavedDoctor table may not be migrated yet

  return (
    <AppShell navItems={PATIENT_NAV} user={{ name: me.name, role: "Patient", image: me.image }} title="Saved doctors" subtitle="Doctors you've saved for later.">
      {saved.length === 0 ? (
        <EmptyState icon={Heart} title="No saved doctors yet" body="Tap Save on any doctor's profile to keep them here for quick booking." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {saved.map((s) => {
            const d = s.doctor;
            return (
              <Card key={s.id} className="flex items-center gap-3 p-4">
                <Avatar src={d.user.image} name={d.user.name} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold text-ge-ink">{d.user.name}</div>
                  <div className="truncate text-[11.5px] text-ge-primary">{d.specialties[0]?.specialty.nameEn ?? "—"}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ge-muted">
                    <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 fill-current text-[color:var(--ge-star)]" /> {d.ratingAvg.toFixed(1)}</span>
                    <span>·</span>
                    <span>{d.city.nameEn}</span>
                    <span>·</span>
                    <span className="ge-mono">{formatPkr(d.consultFeePaisa)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Button asChild size="sm"><Link href={`/doctor/${d.slug}/book`}>Book</Link></Button>
                  <SaveDoctorButton doctorId={d.id} initialSaved className="h-7 px-2 text-[11px]" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
