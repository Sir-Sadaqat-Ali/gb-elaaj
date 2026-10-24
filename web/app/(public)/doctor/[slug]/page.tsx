import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Briefcase, ChevronRight, Globe, Lock, MapPin, ShieldCheck, Star, Video, Building } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/brand/verified-badge";
import { SaveDoctorButton } from "@/components/doctors/save-doctor-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/marketing/bits";
import { StickyBookBar } from "@/components/booking/sticky-book-bar";
import { formatPkr, formatTime, formatDate, maskLicense } from "@/lib/formatting";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doctor = await prisma.doctorProfile.findUnique({
    where: { slug },
    include: { user: true, city: true, specialties: { include: { specialty: true } } },
  });
  if (!doctor || doctor.verifiedStatus !== "APPROVED") {
    return { title: "Doctor not found" };
  }
  const specialty = doctor.specialties[0]?.specialty.nameEn ?? "Specialist";
  return {
    title: `${doctor.user.name} — ${specialty} in ${doctor.city.nameEn}`,
    description: `Book a verified ${specialty.toLowerCase()} consultation with ${doctor.user.name} in ${doctor.city.nameEn}. PMDC-verified, live availability, video or clinic.`,
  };
}

export default async function DoctorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const doctor = await prisma.doctorProfile.findUnique({
    where: { slug },
    include: {
      user: true,
      city: true,
      specialties: { include: { specialty: true } },
      availability: {
        where: { startsAt: { gte: new Date() }, status: "OPEN" },
        orderBy: { startsAt: "asc" },
        take: 18,
      },
      reviews: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!doctor || doctor.verifiedStatus !== "APPROVED") notFound();

  // Saved-state for a signed-in patient viewing this profile.
  const session = await auth();
  const isPatient = session?.user?.role === "PATIENT";
  let initialSaved = false;
  if (session?.user && isPatient) {
    try {
      const pp = await prisma.patientProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
      if (pp) {
        const s = await prisma.savedDoctor.findUnique({
          where: { patientId_doctorId: { patientId: pp.id, doctorId: doctor.id } },
          select: { id: true },
        });
        initialSaved = !!s;
      }
    } catch {
      // SavedDoctor table may not be migrated yet — degrade to "not saved".
    }
  }

  // Schema.org structured data for SEO (Physician)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: doctor.user.name,
    url: `${baseUrl}/doctor/${doctor.slug}`,
    image: doctor.user.image ?? undefined,
    medicalSpecialty: doctor.specialties.map((s) => s.specialty.nameEn),
    address: {
      "@type": "PostalAddress",
      addressLocality: doctor.city.nameEn,
      addressCountry: "PK",
    },
    aggregateRating: doctor.ratingCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: doctor.ratingAvg,
      reviewCount: doctor.ratingCount,
    } : undefined,
  };

  // group slots by day label
  const slotsByDay: Record<string, typeof doctor.availability> = {};
  for (const slot of doctor.availability) {
    const key = formatDate(slot.startsAt);
    (slotsByDay[key] ??= []).push(slot);
  }
  const dayKeys = Object.keys(slotsByDay).slice(0, 5);

  const ratingHist = [5, 4, 3, 2, 1].map((star) => {
    const count = doctor.reviews.filter((r) => r.rating === star).length || (star === 5 ? Math.round(doctor.ratingCount * 0.88) : star === 4 ? Math.round(doctor.ratingCount * 0.09) : 0);
    return { star, count };
  });
  const total = ratingHist.reduce((a, b) => a + b.count, 0) || 1;

  return (
    <div className="bg-ge-soft-bg pb-24 md:pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-ge-blue-tint">
        <div className="ge-container py-5 text-[12px] text-ge-muted">
          <Link href="/" className="hover:text-ge-primary">Home</Link>
          <ChevronRight className="mx-1 inline h-3 w-3" />
          <Link href="/doctors" className="hover:text-ge-primary">Find Doctors</Link>
          <ChevronRight className="mx-1 inline h-3 w-3" />
          <span className="text-ge-ink">{doctor.user.name}</span>
        </div>
      </div>

      <div className="ge-container grid gap-6 pt-6 md:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {/* Hero */}
          <Card className="rounded-3xl border-0 p-6 shadow-card md:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <div className="relative">
                <Avatar src={doctor.user.image} name={doctor.user.name} size={120} className="ring-4 ring-ge-blue-tint" />
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-ge-success" aria-hidden />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="ge-display text-[28px] text-ge-ink">{doctor.user.name}</h1>
                  <VerifiedBadge />
                  {isPatient && <SaveDoctorButton doctorId={doctor.id} initialSaved={initialSaved} className="ml-1" />}
                </div>
                <div className="mt-1 text-[14px] font-medium text-ge-primary">
                  {doctor.specialties.map((s) => s.specialty.nameEn).join(" · ")}
                </div>
                <div className="mt-1 text-[13px] text-ge-muted">{doctor.qualifications}</div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-ge-muted">
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {doctor.experienceYears} yrs experience</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {doctor.clinic ?? doctor.city.nameEn}</span>
                  <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" /> {doctor.languages.join(", ")}</span>
                </div>
                <dl className="mt-5 grid grid-cols-4 gap-0 rounded-2xl bg-ge-soft-bg p-4">
                  {[
                    { v: `${doctor.ratingAvg.toFixed(1)}★`, l: `${doctor.ratingCount} reviews` },
                    { v: `${doctor.satisfactionPct}%`, l: "Satisfied patients" },
                    { v: `~${20} min`, l: "Avg slot" },
                    { v: `${doctor.modes.length}`, l: "Consult modes" },
                  ].map((s, i) => (
                    <div key={s.l} className={i ? "border-l border-ge-border pl-4" : ""}>
                      <dt className="ge-display text-[19px] text-ge-navy">{s.v}</dt>
                      <dd className="mt-0.5 text-[11px] text-ge-muted">{s.l}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </Card>

          {/* Slots */}
          <Card className="rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-ge-ink">Available slots</h2>
              <Badge variant="success">Live availability</Badge>
            </div>
            {dayKeys.length === 0 ? (
              <p className="mt-4 text-sm text-ge-muted">No upcoming slots available. Please check back tomorrow.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {dayKeys.map((day) => (
                  <div key={day}>
                    <div className="mb-2 text-[12px] font-semibold text-ge-navy">{day}</div>
                    <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                      {slotsByDay[day]!.map((s) => (
                        <Link
                          key={s.id}
                          href={`/doctor/${slug}/book?slot=${s.id}`}
                          className="rounded-full border border-ge-border bg-white px-3 py-2 text-center text-[12px] font-medium text-ge-ink transition hover:border-ge-primary hover:bg-ge-blue-tint hover:text-ge-primary"
                        >
                          {formatTime(s.startsAt)}
                          {s.mode === "VIDEO" ? (
                            <span className="ml-1 inline-flex"><Video className="h-3 w-3" aria-hidden /></span>
                          ) : (
                            <span className="ml-1 inline-flex"><Building className="h-3 w-3" aria-hidden /></span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* About */}
          <Card className="rounded-3xl p-6">
            <h2 className="text-[15px] font-semibold text-ge-ink">About {doctor.user.name.split(" ")[0]}</h2>
            <p className="mt-3 text-[13px] leading-relaxed text-ge-muted">{doctor.bioEn}</p>
          </Card>

          {/* Reviews */}
          <Card className="rounded-3xl p-6">
            <h2 className="text-[15px] font-semibold text-ge-ink">Patient reviews</h2>
            <div className="mt-4 grid gap-5 md:grid-cols-[200px_1fr]">
              <div className="border-b border-ge-border pb-4 text-center md:border-b-0 md:border-r md:pb-0 md:pr-4">
                <div className="ge-display text-4xl text-ge-navy">{doctor.ratingAvg.toFixed(1)}</div>
                <div className="mt-1 inline-flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.round(doctor.ratingAvg) ? "fill-ge-star text-ge-star" : "text-ge-border"}`}
                    />
                  ))}
                </div>
                <div className="mt-1 text-[11px] text-ge-muted">{doctor.ratingCount} reviews</div>
              </div>
              <div className="space-y-1.5">
                {ratingHist.map((r) => (
                  <div key={r.star} className="flex items-center gap-2 text-[11px]">
                    <span className="w-4 text-ge-muted">{r.star}★</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ge-border">
                      <div className="h-full bg-ge-primary" style={{ width: `${(r.count / total) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right text-ge-muted">{Math.round((r.count / total) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 space-y-5">
              {doctor.reviews.length === 0 ? (
                <p className="text-sm text-ge-muted">No reviews yet.</p>
              ) : (
                doctor.reviews.map((r) => (
                  <div key={r.id} className="border-t border-ge-border pt-4 first:border-0 first:pt-0">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={r.author.image} name={r.author.name} size={36} />
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold text-ge-ink">{r.author.name}</div>
                        <div className="text-[11px] text-ge-muted">{formatDate(r.createdAt)}</div>
                      </div>
                      <div className="inline-flex">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-ge-star text-ge-star" : "text-ge-border"}`} />
                        ))}
                      </div>
                    </div>
                    {r.text && <p className="mt-2 text-[13px] leading-relaxed text-ge-ink">{r.text}</p>}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Sticky booking */}
        <aside id="book" className="space-y-4 md:sticky md:top-24 md:self-start">
          <Card className="rounded-3xl border-0 p-5 shadow-card">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-ge-success">
              <span className="h-2 w-2 rounded-full bg-ge-success" /> Available now
            </div>
            <h3 className="mt-2 font-display text-[16px] font-semibold text-ge-ink">Book your appointment</h3>
            <p className="mt-1 text-[12px] text-ge-muted">Secure your slot in 60 seconds.</p>

            <div className="mt-4 rounded-2xl bg-ge-blue-tint p-4 text-[12px]">
              <Row label="Consultation type" value={doctor.modes.includes("VIDEO") ? "Video Call" : "Clinic"} />
              <Row label="Fee" value={formatPkr(doctor.consultFeePaisa)} />
              <Row label="Duration" value="20 minutes" />
              <div className="my-3 border-t border-ge-border" />
              <Row label="Total" value={<span className="ge-mono text-base font-semibold text-ge-navy">{formatPkr(doctor.consultFeePaisa)}</span>} />
            </div>
            <Button asChild className="mt-4 w-full" size="lg">
              <Link href={`/doctor/${slug}/book`}>
                Continue booking <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 text-[11px] text-ge-muted">
              <Lock className="h-3 w-3" /> Secure payment · Refundable up to 1hr before
            </p>
          </Card>

          <Card className="rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <IconTile icon={ShieldCheck} size="sm" />
              <div>
                <div className="text-[13px] font-semibold text-ge-ink">PMDC verified</div>
                <div className="text-[11px] text-ge-muted">Checked by our medical board</div>
              </div>
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-ge-muted">
              License <span className="ge-mono">{maskLicense(doctor.pmdcNumber)}</span> verified against PMDC records.
            </p>
          </Card>
        </aside>
      </div>

      <StickyBookBar slug={slug} feePaisa={doctor.consultFeePaisa} name={doctor.user.name} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-ge-muted">{label}</span>
      <span className="font-semibold text-ge-ink">{value}</span>
    </div>
  );
}
