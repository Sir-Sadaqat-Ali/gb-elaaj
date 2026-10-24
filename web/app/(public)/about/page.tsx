import { ShieldCheck, MapPin, Wallet, Lock } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { FinalCta } from "@/components/marketing/cta";
import { IconTile } from "@/components/marketing/bits";

export const metadata = {
  title: "About Gb Elaaj",
  description: "Verified doctors, home labs, online pharmacy, and home nursing for families across Gilgit-Baltistan and Pakistan.",
};

const VALUES = [
  { icon: ShieldCheck, title: "Verified, always", body: "Every doctor is checked against PMDC records before they can take a booking." },
  { icon: MapPin, title: "Built for distance", body: "Founded in Gilgit-Baltistan to bring quality care where hospitals are far away." },
  { icon: Wallet, title: "Transparent pricing", body: "Clear fees and easy bank transfer — no surprises, pay only for what you use." },
  { icon: Lock, title: "Private by default", body: "Your medical records stay with you, encrypted and never sold." },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      <PageHero
        eyebrow="About Gb Elaaj"
        title="Healthcare without the distance"
        subtitle="Gb Elaaj was founded in Gilgit-Baltistan to solve one problem: getting trustworthy, timely healthcare to families far from major cities."
      />

      <div className="ge-container grid gap-10 py-16 md:grid-cols-[1fr_1.1fr] md:py-20">
        <div>
          <h2 className="ge-display text-[28px] leading-[36px] text-ge-ink md:text-[34px] md:leading-[42px]">
            Calm, plain-language care
          </h2>
        </div>
        <div className="space-y-4 text-[15.5px] leading-relaxed text-ge-muted">
          <p>
            Today the platform connects verified specialists with patients across Gilgit-Baltistan and Pakistan — and
            supports home lab collection, online pharmacy, and home nursing, all in one place.
          </p>
          <p>
            We believe healthcare should be calm and clear. Our doctors are PMDC-verified, our prices are transparent,
            and your records stay with you — encrypted and private.
          </p>
        </div>
      </div>

      <section className="bg-ge-blue-tint py-16 md:py-20">
        <div className="ge-container">
          <h2 className="ge-display mb-8 text-[26px] text-ge-ink md:text-[34px]">What we stand for</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-3xl border border-ge-border bg-white p-6">
                <IconTile icon={v.icon} size="sm" />
                <h3 className="mt-4 text-[15px] font-semibold text-ge-ink">{v.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ge-muted">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FinalCta />
    </div>
  );
}
