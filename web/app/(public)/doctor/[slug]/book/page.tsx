import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/brand/verified-badge";
import { BookingFlow } from "@/components/booking/booking-flow";
import { formatPkr } from "@/lib/formatting";
import { ChevronRight, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Book consultation",
  description: "Book a verified consultation slot with a Gb Elaaj doctor.",
};

export default async function BookDoctorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ slot?: string }>;
}) {
  const { slug } = await params;
  const { slot: preSelectSlot } = await searchParams;

  const session = await auth();
  if (!session?.user) {
    redirect(`/login?next=${encodeURIComponent(`/doctor/${slug}/book`)}`);
  }
  if (session.user.role !== "PATIENT") {
    redirect(`/doctor/${slug}`);
  }

  const doctor = await prisma.doctorProfile.findUnique({
    where: { slug },
    include: {
      user: true,
      city: true,
      specialties: { include: { specialty: true } },
      availability: {
        where: { startsAt: { gte: new Date() }, status: "OPEN" },
        orderBy: { startsAt: "asc" },
        take: 36,
      },
    },
  });
  if (!doctor || doctor.verifiedStatus !== "APPROVED" || !doctor.active) notFound();

  return (
    <div className="bg-ge-soft-bg pb-16">
      <div className="bg-ge-blue-tint">
        <div className="ge-container py-5 text-[12px] text-ge-muted">
          <Link href="/" className="hover:text-ge-primary">Home</Link>
          <ChevronRight className="mx-1 inline h-3 w-3" />
          <Link href={`/doctor/${slug}`} className="hover:text-ge-primary">{doctor.user.name}</Link>
          <ChevronRight className="mx-1 inline h-3 w-3" />
          <span className="text-ge-ink">Book appointment</span>
        </div>
      </div>

      <div className="ge-container grid gap-6 pt-6 md:grid-cols-[1fr_320px]">
        <div>
          <BookingFlow
            doctorSlug={doctor.slug}
            doctorName={doctor.user.name}
            videoFeePaisa={doctor.consultFeePaisa}
            clinicFeePaisa={doctor.clinicFeePaisa}
            availability={doctor.availability.map((s) => ({
              id: s.id,
              startsAt: s.startsAt.toISOString(),
              mode: s.mode,
            }))}
            preSelectSlotId={preSelectSlot ?? null}
          />
        </div>

        <aside className="space-y-4 md:sticky md:top-20 md:self-start">
          <Card className="rounded-3xl border-0 p-5 shadow-card">
            <div className="flex items-center gap-3">
              <Avatar src={doctor.user.image} name={doctor.user.name} size={48} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-ge-ink">{doctor.user.name}</span>
                  <VerifiedBadge size="sm" />
                </div>
                <div className="text-[12px] text-ge-primary">{doctor.specialties[0]?.specialty.nameEn}</div>
                <div className="text-[11px] text-ge-muted">{doctor.city.nameEn}</div>
              </div>
            </div>
            <div className="mt-4 space-y-1 text-[12.5px]">
              <Row label="Video fee" value={formatPkr(doctor.consultFeePaisa)} />
              {doctor.clinicFeePaisa > 0 && <Row label="Clinic fee" value={formatPkr(doctor.clinicFeePaisa)} />}
              <Row label="Duration" value="20 minutes" />
            </div>
          </Card>
          <Card className="rounded-3xl bg-ge-blue-tint p-5">
            <p className="text-[11.5px] leading-relaxed text-ge-muted">
              <Lock className="inline h-3 w-3" /> Secure payment · Refundable up to 1 hour before. Confirmation arrives by SMS and WhatsApp.
            </p>
            <Button asChild variant="link" size="sm" className="mt-1 px-0">
              <Link href={`/doctor/${slug}`}>← Back to profile</Link>
            </Button>
          </Card>
        </aside>
      </div>
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
