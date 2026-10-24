import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PATIENT_NAV } from "@/app/(patient)/patient/_nav";
import { DoctorCard, type DoctorCardData } from "@/components/doctor-card/doctor-card";
import { EmptyState } from "@/components/data/empty-state";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Find a doctor" };

type SearchParams = {
  q?: string;
  specialty?: string;
  city?: string;
  mode?: "video" | "clinic";
};

export default async function PatientDoctorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireRole("PATIENT");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;
  const params = await searchParams;

  const where: Prisma.DoctorProfileWhereInput = {
    active: true,
    verifiedStatus: "APPROVED",
  };
  if (params.q) {
    where.OR = [
      { user: { name: { contains: params.q, mode: "insensitive" } } },
      { qualifications: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.specialty) {
    where.specialties = { some: { specialty: { slug: params.specialty } } };
  }
  if (params.city) where.city = { slug: params.city };
  if (params.mode === "video") where.modes = { has: "VIDEO" };
  if (params.mode === "clinic") where.modes = { has: "CLINIC" };

  const [doctors, specialties, cities] = await Promise.all([
    prisma.doctorProfile.findMany({
      where,
      include: { user: true, city: true, specialties: { include: { specialty: true } } },
      orderBy: { ratingAvg: "desc" },
      take: 20,
    }),
    prisma.specialty.findMany({ where: { active: true }, orderBy: { nameEn: "asc" } }),
    prisma.city.findMany({ where: { active: true }, orderBy: { nameEn: "asc" } }),
  ]);

  const cards: DoctorCardData[] = doctors.map((d) => ({
    slug: d.slug,
    name: d.user.name,
    image: d.user.image,
    specialty: d.specialties[0]?.specialty.nameEn ?? "Specialist",
    qualifications: d.qualifications,
    city: d.city.nameEn,
    clinic: d.clinic,
    experienceYears: d.experienceYears,
    ratingAvg: d.ratingAvg,
    ratingCount: d.ratingCount,
    consultFeePaisa: d.consultFeePaisa,
    modes: d.modes,
    available: true,
    nextSlotLabel: "Today",
  }));

  return (
    <AppShell
      navItems={PATIENT_NAV}
      user={{ name: me.name, role: "Patient", image: me.image }}
      title="Find a doctor"
      subtitle="Verified specialists across Pakistan."
    >
      <form className="mb-4 grid gap-2 rounded-lg border border-ge-border bg-white p-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search by name, condition, or qualification…"
          className="h-10 rounded-md border border-ge-border bg-white px-3 text-sm placeholder:text-ge-muted"
        />
        <select name="specialty" defaultValue={params.specialty ?? ""} className="h-10 rounded-md border border-ge-border bg-white px-3 text-sm">
          <option value="">All specialties</option>
          {specialties.map((s) => <option key={s.slug} value={s.slug}>{s.nameEn}</option>)}
        </select>
        <select name="city" defaultValue={params.city ?? ""} className="h-10 rounded-md border border-ge-border bg-white px-3 text-sm">
          <option value="">All cities</option>
          {cities.map((c) => <option key={c.slug} value={c.slug}>{c.nameEn}</option>)}
        </select>
        <button type="submit" className="h-10 rounded-md bg-ge-primary px-4 text-sm font-medium text-white">Search</button>
      </form>

      {cards.length === 0 ? (
        <EmptyState icon={Search} title="No doctors match your filters" body="Widen your filters or try a different city." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {cards.map((d) => <DoctorCard key={d.slug} doctor={d} />)}
        </div>
      )}
    </AppShell>
  );
}
