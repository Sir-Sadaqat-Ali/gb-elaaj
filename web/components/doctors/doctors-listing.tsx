import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DoctorCard, type DoctorCardData } from "@/components/doctor-card/doctor-card";
import { EmptyState } from "@/components/data/empty-state";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/marketing/bits";

export type DoctorsSearchParams = {
  q?: string;
  specialty?: string;
  city?: string;
  mode?: "video" | "clinic";
  sort?: "rating" | "fee_low" | "fee_high" | "experience";
  page?: string;
};

const PAGE_SIZE = 8;

export async function DoctorsListing({
  params,
  scopedSpecialty,
  scopedCity,
}: {
  params: DoctorsSearchParams;
  scopedSpecialty?: string;
  scopedCity?: string;
}) {
  const page = Math.max(1, parseInt(params.page ?? "1") || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const specialtySlug = scopedSpecialty ?? params.specialty;
  const citySlug = scopedCity ?? params.city;

  const where: Prisma.DoctorProfileWhereInput = {
    active: true,
    verifiedStatus: "APPROVED",
  };
  if (params.q) {
    where.OR = [
      { user: { name: { contains: params.q, mode: "insensitive" } } },
      { qualifications: { contains: params.q, mode: "insensitive" } },
      { specialties: { some: { specialty: { nameEn: { contains: params.q, mode: "insensitive" } } } } },
    ];
  }
  if (specialtySlug) {
    where.specialties = { some: { specialty: { slug: specialtySlug } } };
  }
  if (citySlug) {
    where.city = { slug: citySlug };
  }
  if (params.mode === "video") where.modes = { has: "VIDEO" };
  if (params.mode === "clinic") where.modes = { has: "CLINIC" };

  const orderBy: Prisma.DoctorProfileOrderByWithRelationInput =
    params.sort === "fee_low" ? { consultFeePaisa: "asc" }
    : params.sort === "fee_high" ? { consultFeePaisa: "desc" }
    : params.sort === "experience" ? { experienceYears: "desc" }
    : { ratingAvg: "desc" };

  const [total, doctors, specialties, cities] = await Promise.all([
    prisma.doctorProfile.count({ where }),
    prisma.doctorProfile.findMany({
      where,
      include: { user: true, city: true, specialties: { include: { specialty: true } } },
      orderBy,
      take: PAGE_SIZE,
      skip,
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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const scopeLabel = scopedSpecialty
    ? scopedSpecialty.replace(/-/g, " ")
    : scopedCity
    ? `Doctors in ${scopedCity}`
    : "Verified doctors";

  return (
    <div className="bg-white pb-20">
      <section className="bg-ge-blue-tint">
        <div className="ge-container py-10 md:py-14">
          <nav className="text-[12px] text-ge-muted">
            <Link href="/" className="hover:text-ge-primary">Home</Link>
            <ChevronRight className="mx-1 inline h-3 w-3" />
            <span className="text-ge-ink">Find Doctors</span>
            {scopedSpecialty && (
              <>
                <ChevronRight className="mx-1 inline h-3 w-3" />
                <span className="capitalize text-ge-ink">{scopedSpecialty.replace("-", " ")}</span>
              </>
            )}
            {scopedCity && (
              <>
                <ChevronRight className="mx-1 inline h-3 w-3" />
                <span className="capitalize text-ge-ink">{scopedCity}</span>
              </>
            )}
          </nav>
          <div className="mt-4"><Eyebrow><span className="capitalize">{scopeLabel}</span></Eyebrow></div>
          <h1 className="ge-display mt-4 text-[34px] leading-[42px] text-ge-ink md:text-[48px] md:leading-[56px]">
            Find a doctor you can trust
          </h1>
          <p className="mt-3 text-[15px] text-ge-muted">
            {total} doctor{total === 1 ? "" : "s"} available · live availability, updated every minute
          </p>

          <form className="mt-6 grid w-full max-w-3xl items-center gap-1 rounded-2xl border border-ge-border bg-white p-2 shadow-card-soft md:grid-cols-[1.5fr_1fr_1fr_auto] md:rounded-full">
            <label className="flex items-center gap-2.5 px-4 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-ge-primary" />
              <input
                name="q"
                defaultValue={params.q}
                placeholder="Doctor, specialty, or condition"
                className="w-full bg-transparent text-[14px] text-ge-ink placeholder:text-ge-muted focus:outline-none"
              />
            </label>
            <select
              name="specialty"
              defaultValue={params.specialty ?? scopedSpecialty ?? ""}
              className="h-10 bg-transparent px-3 text-[13.5px] text-ge-ink focus:outline-none md:border-l md:border-ge-border"
            >
              <option value="">All specialties</option>
              {specialties.map((s) => (
                <option key={s.slug} value={s.slug}>{s.nameEn}</option>
              ))}
            </select>
            <select
              name="city"
              defaultValue={params.city ?? scopedCity ?? ""}
              className="h-10 bg-transparent px-3 text-[13.5px] text-ge-ink focus:outline-none md:border-l md:border-ge-border"
            >
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c.slug} value={c.slug}>{c.nameEn}</option>
              ))}
            </select>
            <Button className="w-full md:w-auto">Search</Button>
          </form>
        </div>
      </section>

      <div className="ge-container grid gap-6 py-10 md:grid-cols-[260px_1fr]">
        <aside className="sticky top-24 self-start rounded-3xl border border-ge-border bg-white p-6">
          <h2 className="text-sm font-semibold text-ge-ink">Filters</h2>
          <p className="mt-1 text-xs text-ge-muted">Refine your search.</p>
          <div className="mt-4 space-y-4">
            <FilterBlock label="Consultation type">
              <PillLink current={params.mode} options={[{ v: undefined, l: "Any" }, { v: "video", l: "Video" }, { v: "clinic", l: "Clinic" }]} param="mode" base={params} />
            </FilterBlock>
            <FilterBlock label="Sort by">
              <PillLink
                current={params.sort}
                options={[
                  { v: undefined, l: "Relevance" },
                  { v: "rating", l: "Rating" },
                  { v: "fee_low", l: "Fee ↑" },
                  { v: "fee_high", l: "Fee ↓" },
                  { v: "experience", l: "Most exp." },
                ]}
                param="sort"
                base={params}
              />
            </FilterBlock>
          </div>
        </aside>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ge-ink">
              {total} doctor{total === 1 ? "" : "s"}
            </span>
          </div>

          {cards.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No doctors match these filters"
              body="Try widening your filters or searching by specialty."
              action={
                <Button asChild variant="secondary">
                  <Link href="/doctors">Reset filters</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {cards.map((d) => (
                <DoctorCard key={d.slug} doctor={d} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const sp = new URLSearchParams();
                Object.entries(params).forEach(([k, v]) => v && sp.set(k, String(v)));
                sp.set("page", String(p));
                return (
                  <Link
                    key={p}
                    href={`?${sp.toString()}`}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition ${
                      p === page ? "border-ge-navy bg-ge-navy text-white" : "border-ge-border bg-white text-ge-ink hover:border-ge-primary"
                    }`}
                  >
                    {p}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11.5px] font-semibold text-ge-navy">{label}</div>
      {children}
    </div>
  );
}

function PillLink({
  current,
  options,
  param,
  base,
}: {
  current: string | undefined;
  options: { v?: string; l: string }[];
  param: string;
  base: DoctorsSearchParams;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const sp = new URLSearchParams();
        Object.entries(base).forEach(([k, v]) => {
          if (k !== param && v) sp.set(k, String(v));
        });
        if (o.v) sp.set(param, o.v);
        const active = current === o.v;
        return (
          <Link
            key={o.l}
            href={`?${sp.toString()}`}
            className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition ${
              active ? "border-ge-navy bg-ge-navy text-white" : "border-ge-border bg-white text-ge-muted hover:border-ge-primary hover:text-ge-ink"
            }`}
          >
            {o.l}
          </Link>
        );
      })}
    </div>
  );
}
