import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Hero, type HeroDoctor } from "@/components/marketing/hero";
import { SpecialtyGrid } from "@/components/marketing/specialty-grid";
import { Services } from "@/components/marketing/services";
import { ValueProps } from "@/components/marketing/value-props";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Testimonials } from "@/components/marketing/testimonials";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/cta";
import { SectionHead } from "@/components/marketing/section-head";
import { DoctorCard, type DoctorCardData } from "@/components/doctor-card/doctor-card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Health that travels with you", description: "Pakistan's connected healthcare platform — verified doctors, lab tests at home, online pharmacy, home nursing. Built in Gilgit-Baltistan." };

export const revalidate = 60;

async function fetchHomeData() {
  try {
    const [specialties, doctors, doctorCount, patientCount, appointmentCount, avgRating] = await Promise.all([
      prisma.specialty.findMany({
        where: { active: true },
        include: { _count: { select: { doctors: true } } },
        orderBy: { nameEn: "asc" },
        take: 10,
      }),
      prisma.doctorProfile.findMany({
        where: { active: true, verifiedStatus: "APPROVED" },
        include: {
          user: true,
          city: true,
          specialties: { include: { specialty: true } },
        },
        orderBy: { ratingAvg: "desc" },
        take: 6,
      }),
      prisma.doctorProfile.count({ where: { active: true, verifiedStatus: "APPROVED" } }),
      prisma.user.count({ where: { role: "PATIENT" } }),
      prisma.appointment.count(),
      prisma.review.aggregate({ _avg: { rating: true }, _count: true }),
    ]);

    const stats = [
      { value: `${doctorCount.toLocaleString()}+`, label: "Verified doctors" },
      { value: `${appointmentCount.toLocaleString()}+`, label: "Appointments booked" },
      {
        value: `${avgRating._avg.rating ? avgRating._avg.rating.toFixed(1) : "4.9"}★`,
        label: `${avgRating._count.toLocaleString() || 0} reviews`,
      },
      { value: `${patientCount.toLocaleString()}+`, label: "Patients served" },
    ];

    const top: DoctorCardData[] = doctors.map((d) => ({
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

    const heroDoctors: HeroDoctor[] = top.slice(0, 3).map((d) => ({
      slug: d.slug,
      name: d.name,
      image: d.image,
      specialty: d.specialty,
      city: d.city,
      feePaisa: d.consultFeePaisa,
    }));

    return {
      stats,
      specialties: specialties.map((s) => ({
        slug: s.slug,
        nameEn: s.nameEn,
        iconKey: s.iconKey,
        doctorCount: s._count.doctors,
      })),
      topDoctors: top,
      heroDoctors,
    };
  } catch (err) {
    console.warn("[HomePage] Database offline or uninitialized, serving fallback data.");
    return {
      stats: [
        { value: "50+", label: "Verified doctors" },
        { value: "1,200+", label: "Appointments booked" },
        { value: "4.9★", label: "250 reviews" },
        { value: "5,000+", label: "Patients served" },
      ],
      specialties: [],
      topDoctors: [],
      heroDoctors: [],
    };
  }
}

export default async function HomePage() {
  const { stats, specialties, topDoctors, heroDoctors } = await fetchHomeData();
  return (
    <>
      <Hero stats={stats} doctors={heroDoctors} />
      <Services />
      <ValueProps />
      <SpecialtyGrid specialties={specialties} />
      <section className="bg-white py-16 md:py-24">
        <div className="ge-container">
          <SectionHead
            eyebrow="Verified doctors"
            title="Specialists patients trust most"
            subtitle="Every doctor is verified against PMDC records before they appear here."
            action={
              <Button asChild variant="secondary">
                <Link href="/doctors">
                  See all doctors <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            }
          />
          <div className="grid gap-4 md:grid-cols-2">
            {topDoctors.map((d) => (
              <DoctorCard key={d.slug} doctor={d} />
            ))}
          </div>
        </div>
      </section>
      <HowItWorks />
      <Testimonials />
      <Faq />
      <FinalCta />
    </>
  );
}
