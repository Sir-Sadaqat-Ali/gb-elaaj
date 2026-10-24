import Link from "next/link";
import { Activity, Clock, MapPin, Star, Video, Building, ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/brand/verified-badge";
import { Button } from "@/components/ui/button";
import { formatPkr } from "@/lib/formatting";
import { cn } from "@/lib/utils";

export type DoctorCardData = {
  slug: string;
  name: string;
  image?: string | null;
  specialty: string;
  qualifications: string;
  city: string;
  clinic?: string | null;
  experienceYears: number;
  ratingAvg: number;
  ratingCount: number;
  consultFeePaisa: number;
  modes: string[]; // VIDEO | CLINIC
  available?: boolean;
  nextSlotLabel?: string;
};

export function DoctorCard({
  doctor,
  variant = "list",
  className,
}: {
  doctor: DoctorCardData;
  variant?: "list" | "mini" | "featured";
  className?: string;
}) {
  if (variant === "mini") {
    return (
      <Link
        href={`/doctor/${doctor.slug}`}
        className={cn("flex items-center gap-3 rounded-2xl border border-ge-border bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-card-soft", className)}
      >
        <Avatar src={doctor.image} name={doctor.name} size={44} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-ge-ink">{doctor.name}</div>
          <div className="text-[11px] text-ge-muted">{doctor.specialty}</div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-ge-muted">
            <Star className="h-3 w-3 fill-ge-star text-ge-star" />
            <strong className="text-ge-ink">{doctor.ratingAvg.toFixed(1)}</strong>
            <span>({doctor.ratingCount})</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article className={cn("flex gap-4 rounded-3xl border border-ge-border bg-white p-5 transition hover:shadow-card-soft", className)}>
      <div className="relative shrink-0">
        <Avatar src={doctor.image} name={doctor.name} size={72} />
        {doctor.available !== undefined && (
          <span
            aria-hidden
            className={cn(
              "absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white",
              doctor.available ? "bg-ge-success" : "bg-ge-warning"
            )}
          />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Link href={`/doctor/${doctor.slug}`} className="text-[15px] font-semibold tracking-tight text-ge-ink hover:underline">
                {doctor.name}
              </Link>
              <VerifiedBadge size="sm" />
            </div>
            <div className="mt-0.5 text-[12px] font-medium text-ge-primary">{doctor.specialty}</div>
            <div className="mt-1 text-[11.5px] text-ge-muted">{doctor.qualifications}</div>
          </div>
          <div className="text-right">
            <div className="text-[10.5px] uppercase tracking-wider text-ge-muted">Consultation</div>
            <div className="ge-mono mt-0.5 text-[15px] font-semibold text-ge-ink">{formatPkr(doctor.consultFeePaisa)}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ge-muted">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3 w-3 fill-ge-star text-ge-star" />
            <strong className="text-ge-ink">{doctor.ratingAvg.toFixed(1)}</strong>
            <span>({doctor.ratingCount})</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Activity className="h-3 w-3" /> {doctor.experienceYears} yrs
          </span>
          {doctor.clinic && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {doctor.clinic}, {doctor.city}
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ge-border pt-3">
          <div className="flex gap-1.5">
            {doctor.modes.includes("VIDEO") && (
              <Badge variant="info" className="gap-1">
                <Video className="h-3 w-3" /> Video
              </Badge>
            )}
            {doctor.modes.includes("CLINIC") && (
              <Badge variant="neutral" className="gap-1">
                <Building className="h-3 w-3" /> Clinic
              </Badge>
            )}
          </div>
          <span className="flex-1" />
          {doctor.nextSlotLabel && (
            <span className="inline-flex items-center gap-1 text-[11px] text-ge-success">
              <Clock className="h-3 w-3" /> Next: {doctor.nextSlotLabel}
            </span>
          )}
          <Button asChild variant="secondary" size="sm">
            <Link href={`/doctor/${doctor.slug}`}>View</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/doctor/${doctor.slug}#book`}>
              Book <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
