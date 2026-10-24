import Link from "next/link";
import { Heart, Stethoscope, User, Sparkles, Users, Activity, Headphones, Brain, Plus, Eye, type LucideIcon } from "lucide-react";
import { SectionHead } from "@/components/marketing/section-head";
import { IconTile } from "@/components/marketing/bits";

const ICONS: Record<string, LucideIcon> = {
  Heart, Stethoscope, User, Spark: Sparkles, Users, Activity, Headset: Headphones, Brain, Plus, Eye,
};

export function SpecialtyGrid({
  specialties,
}: {
  specialties: { slug: string; nameEn: string; iconKey?: string | null; doctorCount?: number }[];
}) {
  return (
    <section className="bg-ge-blue-tint py-16 md:py-24">
      <div className="ge-container">
        <SectionHead
          eyebrow="Browse by specialty"
          title="Care for every condition"
          subtitle="Verified specialists across major disciplines, available for video and clinic visits."
        />
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {specialties.map((s) => {
            const Icon = ICONS[s.iconKey ?? "Stethoscope"] ?? Stethoscope;
            return (
              <li key={s.slug}>
                <Link
                  href={`/doctors/${s.slug}`}
                  className="flex h-full flex-col items-center justify-center rounded-3xl border border-ge-border bg-white p-6 text-center transition hover:-translate-y-1 hover:shadow-card-soft"
                >
                  <IconTile icon={Icon} size="sm" />
                  <span className="mt-3.5 text-[13.5px] font-semibold text-ge-ink">{s.nameEn}</span>
                  {typeof s.doctorCount === "number" && (
                    <span className="mt-0.5 text-[11px] text-ge-muted">{s.doctorCount} doctors</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
