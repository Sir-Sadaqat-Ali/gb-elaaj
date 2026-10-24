import { Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { SectionHead } from "@/components/marketing/section-head";
import { MARKETING_IMG } from "@/lib/marketing-images";

const QUOTES = [
  {
    quote: "Booked a cardiologist from Skardu and had my video consult the same evening. No more 12-hour drives to Gilgit for a follow-up.",
    name: "Karim Shah",
    city: "Skardu",
    photo: MARKETING_IMG.patient.karim,
  },
  {
    quote: "The lab sent someone to collect my mother's blood sample at home and the report was on my phone by evening. Exactly what we needed.",
    name: "Fatima Baig",
    city: "Gilgit",
    photo: MARKETING_IMG.patient.fatima,
  },
  {
    quote: "Ordered my father's blood-pressure medicines and they arrived next day. Paying by bank transfer was simple and clearly explained.",
    name: "Imran Ali",
    city: "Hunza",
    photo: MARKETING_IMG.patient.imran,
  },
  {
    quote: "The home nurse for my post-surgery dressing was professional and on time. Being able to see her on the way was reassuring.",
    name: "Sana Karim",
    city: "Danyore",
    photo: MARKETING_IMG.patient.sana,
  },
];

export function Testimonials() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="ge-container">
        <SectionHead
          eyebrow="From our patients"
          title="Trusted across Gilgit-Baltistan"
          subtitle="Real care, delivered where getting to a hospital isn't always easy."
          center
        />
        <div className="grid gap-5 md:grid-cols-2">
          {QUOTES.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-3xl border border-ge-border bg-white p-7">
              <div className="flex gap-0.5 text-ge-star" role="img" aria-label="Rated 5 out of 5">
                {["s1", "s2", "s3", "s4", "s5"].map((k) => (
                  <Star key={k} className="h-4 w-4 fill-current" aria-hidden />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ge-ink">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <Avatar name={t.name} src={t.photo} size={38} />
                <span className="flex flex-col">
                  <span className="text-[13.5px] font-semibold text-ge-ink">{t.name}</span>
                  <span className="text-[12px] text-ge-muted">{t.city}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
