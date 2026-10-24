import Image from "next/image";
import { Check } from "lucide-react";
import { Eyebrow } from "@/components/marketing/bits";
import { MARKETING_IMG } from "@/lib/marketing-images";

const POINTS = [
  "Care that reaches you — from Hunza to Skardu, no long travel",
  "Only PMDC-verified doctors take bookings",
  "Booked and confirmed in under a minute",
  "Clear, upfront fees with easy bank transfer",
];

export function ValueProps() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="ge-container grid items-center gap-12 md:grid-cols-2 md:gap-16">
        {/* Overlapping framed photos */}
        <div className="relative order-last pb-10 pr-10 md:order-first">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl">
            <Image src={MARKETING_IMG.careAtHome} alt="A trained nurse providing care at home" fill sizes="(max-width:768px) 100vw, 480px" className="object-cover" />
          </div>
          <div className="absolute bottom-0 right-0 aspect-[4/3] w-[52%] overflow-hidden rounded-3xl border-[6px] border-white shadow-card">
            <Image src={MARKETING_IMG.heroDoctor} alt="A verified doctor on a video consultation" fill sizes="(max-width:768px) 60vw, 260px" className="object-cover" />
          </div>
          <div className="absolute left-0 top-6 rounded-2xl border border-ge-border bg-white p-4 shadow-card">
            <div className="ge-display text-[22px] leading-none text-ge-navy">24–48h</div>
            <div className="mt-1 text-[11.5px] text-ge-muted">Lab reports at home</div>
          </div>
        </div>

        {/* Text + checklist */}
        <div>
          <Eyebrow>Why Gb Elaaj</Eyebrow>
          <h2 className="ge-display mt-4 text-[30px] leading-[38px] text-ge-ink md:text-[42px] md:leading-[50px]">
            Healthcare built for Gilgit-Baltistan
          </h2>
          <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-ge-muted">
            Distance shouldn't decide the care your family gets. We bring verified doctors, labs,
            pharmacy, and nursing to your door.
          </p>
          <ul className="mt-7 space-y-3.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ge-primary text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-[14.5px] leading-relaxed text-ge-ink">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
