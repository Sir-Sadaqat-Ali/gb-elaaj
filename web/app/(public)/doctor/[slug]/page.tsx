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
import { DoctorCalendarSlots } from "@/components/booking/doctor-calendar-slots";
import { formatPkr, formatTime, formatDate, maskLicense, formatPktDateIso } from "@/lib/formatting";
import { ensureDoctorDaySlots, DAILY_SLOT_TIMES, getPktHour } from "@/lib/slots";

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

export default async function DoctorProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { slug } = await params;
  const { date: rawDate } = await searchParams;

  const doctor = await prisma.doctorProfile.findUnique({
    where: { slug },
    include: {
      user: true,
      city: true,
      specialties: { include: { specialty: true } },
      reviews: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!doctor || doctor.verifiedStatus !== "APPROVED") notFound();

  // Selected date or real-time today in Pakistan Time
  const todayIso = formatPktDateIso(new Date());
  const now = new Date();
  const [ty, tm, td] = todayIso.split("-").map(Number);

  // Generate next 7 days in PKT for the Date Picker strip
  const daysList: { iso: string; dayName: string; dateFormatted: string; isToday: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(ty, tm - 1, td + i, 5, 0, 0, 0));
    const iso = formatPktDateIso(d);
    const dayName =
      i === 0
        ? "Today"
        : i === 1
        ? "Tomorrow"
        : new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", weekday: "short" }).format(d);
    const dateFormatted = new Intl.DateTimeFormat("en-PK", {
      timeZone: "Asia/Karachi",
      day: "numeric",
      month: "short",
    }).format(d);
    daysList.push({ iso, dayName, dateFormatted, isToday: i === 0 });
  }

  // If after 5 PM PKT, today's operating hours have ended; default to tomorrow
  const isPastTodayOperatingHours = getPktHour(now) >= 17;
  const defaultDateIso = isPastTodayOperatingHours ? daysList[1]!.iso : todayIso;
  const activeDateIso = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : defaultDateIso;

  const [ay, am, ad] = activeDateIso.split("-").map(Number);
  const activeDate = new Date(Date.UTC(ay, am - 1, ad, 5, 0, 0, 0));

  // Ensure standard 10:00 AM – 5:00 PM (20-min) slots exist for this ONE day
  const daySlots = await ensureDoctorDaySlots(doctor.id, activeDateIso);

  const activeDayObj = daysList.find((d) => d.iso === activeDateIso) ?? {
    dayName: formatDate(activeDate, { weekday: "short" }),
    dateFormatted: formatDate(activeDate, { day: "numeric", month: "short" }),
  };

  // Aggregate standard 21 slots for the active day without duplicates
  const slotPills = DAILY_SLOT_TIMES.map(({ hour, minute }) => {
    const startsAt = new Date(Date.UTC(ay, am - 1, ad, hour - 5, minute, 0, 0));
    const matching = daySlots.filter((s) => s.startsAt.getTime() === startsAt.getTime());
    const isPast = startsAt.getTime() < Date.now();
    const isBooked = matching.some((s) => s.status === "BOOKED");
    const isBlocked = !isBooked && matching.length > 0 && matching.every((s) => s.status === "BLOCKED");
    const isOpen = !isPast && !isBooked && !isBlocked;

    const openSlot = matching.find((s) => s.status === "OPEN") ?? matching[0];

    return {
      startsAt,
      timeLabel: formatTime(startsAt),
      isPast,
      isBooked,
      isBlocked,
      isOpen,
      slotId: openSlot?.id ?? null,
    };
  });

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

      <div className="ge-container grid gap-6 pt-4 sm:pt-6 md:grid-cols-[1fr_360px] w-full max-w-full min-w-0">
        <div className="space-y-5 w-full min-w-0 max-w-full">
          {/* Hero */}
          <Card className="rounded-3xl border-0 p-4 sm:p-6 md:p-7 shadow-card w-full max-w-full min-w-0">
            <div className="flex flex-col gap-4 sm:gap-5 sm:flex-row sm:items-start">
              <div className="relative shrink-0">
                <Avatar src={doctor.user.image} name={doctor.user.name} size={100} className="sm:h-[120px] sm:w-[120px] ring-4 ring-ge-blue-tint" />
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-ge-success" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="ge-display text-[24px] sm:text-[28px] text-ge-ink">{doctor.user.name}</h1>
                  <VerifiedBadge />
                  {isPatient && <SaveDoctorButton doctorId={doctor.id} initialSaved={initialSaved} className="ml-1" />}
                </div>
                <div className="mt-1 text-[13.5px] font-medium text-ge-primary">
                  {doctor.specialties.map((s) => s.specialty.nameEn).join(" · ")}
                </div>
                <div className="mt-0.5 text-[12.5px] text-ge-muted">{doctor.qualifications}</div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ge-muted">
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {doctor.experienceYears} yrs exp</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {doctor.clinic ?? doctor.city.nameEn}</span>
                  <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" /> {doctor.languages.join(", ")}</span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-0 rounded-2xl bg-ge-soft-bg p-3 sm:p-4">
                  {[
                    { v: `${doctor.ratingAvg.toFixed(1)}★`, l: `${doctor.ratingCount} reviews` },
                    { v: `${doctor.satisfactionPct}%`, l: "Satisfied" },
                    { v: `~${20} min`, l: "Avg slot" },
                    { v: `${doctor.modes.length}`, l: "Modes" },
                  ].map((s, i) => (
                    <div key={s.l} className={i ? "sm:border-l sm:border-ge-border sm:pl-3 p-1" : "p-1"}>
                      <dt className="ge-display text-[17px] sm:text-[19px] text-ge-navy">{s.v}</dt>
                      <dd className="mt-0.5 text-[11px] text-ge-muted leading-tight">{s.l}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </Card>

          {/* Interactive Calendar & Slots Section */}
          <Card id="slots" className="rounded-3xl p-4 sm:p-6 scroll-mt-24 w-full max-w-full min-w-0">
            <DoctorCalendarSlots
              doctorSlug={slug}
              todayIso={todayIso}
              activeDateIso={activeDateIso}
              slotPills={slotPills.map((s) => ({
                ...s,
                startsAt: s.startsAt.toISOString(),
              }))}
            />
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
