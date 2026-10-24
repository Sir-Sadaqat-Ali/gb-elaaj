import Link from "next/link";
import { Beaker, Pill, Heart, Stethoscope, type LucideIcon } from "lucide-react";
import { SectionHead } from "@/components/marketing/section-head";
import { IconTile, ArrowChip, Rings } from "@/components/marketing/bits";

const SERVICES: { href: string; icon: LucideIcon; title: string; body: string; cta: string }[] = [
  { href: "/doctors", icon: Stethoscope, title: "Doctor consultations", body: "Verified specialists for video or in-clinic visits, booked in under a minute.", cta: "Find a doctor" },
  { href: "/lab-tests", icon: Beaker, title: "Lab tests at home", body: "Sample collection at your doorstep, digital reports synced to your records.", cta: "Book a test" },
  { href: "/pharmacy", icon: Pill, title: "Online pharmacy", body: "Genuine medicines, upload a prescription or shop direct, delivered to you.", cta: "Order medicine" },
  { href: "/home-care", icon: Heart, title: "Home nursing & care", body: "Trained nurses for IV, dressing, post-op and elderly care at home.", cta: "Request care" },
];

export function Services() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-ge-primary to-ge-navy py-16 md:py-24">
      <Rings className="opacity-70" />
      <div className="ge-container relative">
        <SectionHead
          onDark
          center
          eyebrow="Complete care"
          title="One platform, every healthcare service"
          subtitle="From a quick video consult to home nursing — GB Elaaj covers the whole journey."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="group flex flex-col rounded-3xl bg-white p-6 shadow-card transition hover:-translate-y-1"
            >
              <IconTile icon={s.icon} />
              <h3 className="mt-5 font-display text-[18px] font-semibold leading-[24px] text-ge-ink">{s.title}</h3>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ge-muted">{s.body}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-ge-primary">
                {s.cta} <ArrowChip />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
