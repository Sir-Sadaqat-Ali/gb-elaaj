import Link from "next/link";
import { Search, Stethoscope, MapPin, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Eyebrow } from "@/components/marketing/bits";
import { formatPkr } from "@/lib/formatting";

export type HeroDoctor = {
  slug: string;
  name: string;
  image?: string | null;
  specialty: string;
  city: string;
  feePaisa: number;
};

export function Hero({ stats, doctors }: { stats: { value: string; label: string }[]; doctors: HeroDoctor[] }) {
  const patients = stats.find((s) => /patient/i.test(s.label))?.value;
  return (
    <section className="relative overflow-hidden rounded-b-[40px] bg-gradient-to-b from-ge-blue-tint via-ge-blue-tint to-white">
      <div className="ge-container flex flex-col items-center py-16 text-center md:py-20">
        <Eyebrow>{patients ? `Trusted by ${patients} patients across Gilgit-Baltistan` : "Trusted healthcare for GB & Pakistan"}</Eyebrow>

        <h1 className="ge-display mt-6 max-w-3xl text-[40px] leading-[46px] text-ge-ink md:text-[62px] md:leading-[68px]">
          Quality care that reaches you, wherever you are.
        </h1>

        <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ge-muted md:text-[18px]">
          Book verified doctors, order lab tests at home, refill medicines, and request home nursing —
          all in one place.
        </p>

        {/* Search — single clean pill bar */}
        <form
          action="/doctors"
          className="mt-8 grid w-full max-w-xl items-center gap-1 rounded-2xl border border-ge-border bg-white p-2 text-left shadow-card-soft sm:grid-cols-[1.3fr_1fr_auto] sm:rounded-full"
        >
          <label className="flex items-center gap-2.5 px-4 py-2">
            <Stethoscope className="h-4 w-4 shrink-0 text-ge-primary" />
            <input name="q" placeholder="Doctor, specialty, or symptom" className="w-full bg-transparent text-[14px] text-ge-ink placeholder:text-ge-muted focus:outline-none" />
          </label>
          <label className="flex items-center gap-2.5 px-4 py-2 sm:border-l sm:border-ge-border">
            <MapPin className="h-4 w-4 shrink-0 text-ge-primary" />
            <input name="city" placeholder="City" className="w-full bg-transparent text-[14px] text-ge-ink placeholder:text-ge-muted focus:outline-none" />
          </label>
          <Button size="lg" className="w-full sm:w-auto">
            <Search className="h-4 w-4" /> Search
          </Button>
        </form>

        <p className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-ge-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-ge-primary" /> Every doctor verified against PMDC records
        </p>

        {/* Real doctor cards — product proof in the hero */}
        {doctors.length > 0 && (
          <div className="mt-12 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.slice(0, 3).map((d, i) => (
              <Link
                key={d.slug}
                href={`/doctor/${d.slug}`}
                className={`group rounded-3xl border border-ge-border bg-white p-4 text-left shadow-card-soft transition hover:-translate-y-0.5 hover:shadow-card ${i === 2 ? "hidden lg:block" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <Avatar src={d.image} name={d.name} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[14px] font-semibold text-ge-ink">
                      <span className="truncate">{d.name}</span>
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-ge-primary" />
                    </div>
                    <div className="truncate text-[12px] text-ge-muted">{d.specialty} · {d.city}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-ge-border pt-3">
                  <span className="inline-flex items-center gap-1 text-[12px] text-ge-muted">
                    <Star className="h-3.5 w-3.5 fill-ge-star text-ge-star" /> New · from {formatPkr(d.feePaisa)}
                  </span>
                  <span className="rounded-full bg-ge-primary px-3 py-1 text-[12px] font-semibold text-white transition group-hover:bg-ge-primary-2">
                    Book
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <dl className="mt-12 grid w-full max-w-3xl grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="ge-display text-[26px] leading-none text-ge-navy">{s.value}</dt>
              <dd className="mt-1.5 text-[12.5px] text-ge-muted">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
