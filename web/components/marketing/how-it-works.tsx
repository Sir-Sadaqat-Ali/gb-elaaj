import { Search, CalendarCheck, Video, type LucideIcon } from "lucide-react";
import { SectionHead } from "@/components/marketing/section-head";
import { IconTile } from "@/components/marketing/bits";

export type HowStep = { icon: LucideIcon; title: string; body: string };

const DEFAULT_STEPS: HowStep[] = [
  { icon: Search, title: "Search & filter", body: "Find a verified doctor by specialty, city, fee, or availability — in seconds." },
  { icon: CalendarCheck, title: "Book in 60 seconds", body: "Pick an open slot, add symptoms, pay securely. Confirmation arrives instantly." },
  { icon: Video, title: "Consult & follow up", body: "Join the video room or visit the clinic. Prescriptions and notes save automatically." },
];

export function HowItWorks({
  eyebrow = "How it works",
  title = "From symptom to care, in three steps",
  subtitle,
  steps = DEFAULT_STEPS,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  steps?: HowStep[];
}) {
  return (
    <section className="bg-ge-blue-tint py-16 md:py-24">
      <div className="ge-container">
        <SectionHead eyebrow={eyebrow} title={title} subtitle={subtitle} center />
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="relative flex flex-col rounded-3xl border border-ge-border bg-white p-7">
              <div className="flex items-center justify-between">
                <IconTile icon={s.icon} />
                <span className="ge-display text-[40px] leading-none text-ge-blue-tint">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-5 font-display text-[19px] font-semibold text-ge-ink">{s.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ge-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
