import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/brand/verified-badge";
import { BookingFlow } from "@/components/booking/booking-flow";
import { ensureDoctorUpcomingSlots } from "@/lib/slots";
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
    },
  });
  if (!doctor || doctor.verifiedStatus !== "APPROVED" || !doctor.active) notFound();

  const availability = await ensureDoctorUpcomingSlots(doctor.id);

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

      <div className="ge-container grid gap-6 pt-4 sm:pt-6 md:grid-cols-[1fr_320px] w-full max-w-full min-w-0">
        <div className="w-full min-w-0">
          <BookingFlow
            doctorSlug={doctor.slug}
            doctorName={doctor.user.name}
            videoFeePaisa={doctor.consultFeePaisa}
            clinicFeePaisa={doctor.clinicFeePaisa}
            availability={availability.map((s) => ({
              id: s.id,
              startsAt: s.startsAt.toISOString(),
              mode: s.mode,
            }))}
            preSelectSlotId={preSelectSlot ?? null}
          />
        </div>

        <aside className="order-first space-y-4 md:order-last md:sticky md:top-20 md:self-start w-full min-w-0">
          <Card className="rounded-3xl border border-ge-border bg-white p-4 sm:p-5 shadow-card w-full min-w-0">
            <div className="flex items-center gap-3">
              <Avatar src={doctor.user.image} name={doctor.user.name} size={52} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[15px] font-semibold text-ge-ink">{doctor.user.name}</span>
                  <VerifiedBadge size="sm" />
                </div>
                <div className="text-[12.5px] font-medium text-ge-primary">
                  {doctor.specialties[0]?.specialty.nameEn ?? "Specialist"}
                </div>
                <div className="text-[11.5px] text-ge-muted truncate">
                  {doctor.city.nameEn} {doctor.clinic ? `· ${doctor.clinic}` : ""}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 border-t border-ge-border pt-3 text-[12.5px]">
              <Row label="Video fee" value={formatPkr(doctor.consultFeePaisa)} />
              {doctor.clinicFeePaisa > 0 && <Row label="Clinic fee" value={formatPkr(doctor.clinicFeePaisa)} />}
              <Row label="Duration" value="20 minutes" />
            </div>
          </Card>
          <Card className="rounded-3xl bg-ge-blue-tint p-4 sm:p-5 w-full min-w-0">
            <p className="text-[11.5px] leading-relaxed text-ge-muted">
              <Lock className="inline h-3 w-3 text-ge-primary" /> Secure payment · Refundable up to 1 hour before. Confirmation arrives by SMS and WhatsApp.
            </p>
            <Button asChild variant="link" size="sm" className="mt-2 px-0 text-ge-primary">
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
    <div className="flex items-center justify-between py-1 gap-2 min-w-0">
      <span className="text-ge-muted text-[13px]">{label}</span>
      <span className="font-semibold text-ge-ink text-[13px] shrink-0 text-right">{value}</span>
    </div>
  );
}
