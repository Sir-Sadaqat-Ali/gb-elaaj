import Link from "next/link";
import { Activity, Clock, Heart, Syringe, ArrowRight, ShieldCheck, CalendarClock, MapPin, ClipboardList, UserCheck, HeartHandshake } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/marketing/page-hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FinalCta } from "@/components/marketing/cta";
import { IconTile } from "@/components/marketing/bits";
import { formatPkr } from "@/lib/formatting";

export const metadata = { title: "Home care", description: "Trained nurses, physiotherapists, and elderly caregivers visit at your schedule. Hourly or full-day plans with live check-in." };

const SERVICES = [
  { icon: Syringe, title: "IV antibiotics", body: "Hospital-grade IV therapy in your home with a verified senior nurse.", durationMin: 60, pricePaisa: 350000 },
  { icon: Activity, title: "Wound dressing", body: "Daily wound care for post-surgical or chronic wounds.", durationMin: 45, pricePaisa: 250000 },
  { icon: Heart, title: "Elderly care", body: "Companionship, vitals monitoring, and medication reminders.", durationMin: 240, pricePaisa: 750000 },
  { icon: Activity, title: "Physiotherapy", body: "Mobility, post-op rehab, and geriatric physiotherapy at home.", durationMin: 60, pricePaisa: 400000 },
  { icon: Heart, title: "Post-op care", body: "Dressing, vitals, and mobility support after discharge.", durationMin: 90, pricePaisa: 450000 },
  { icon: Activity, title: "Diabetes care", body: "Blood sugar monitoring, insulin admin, and lifestyle counsel.", durationMin: 45, pricePaisa: 280000 },
];

export default function HomeCarePage() {
  return (
    <div className="bg-white pb-4">
      <PageHero
        eyebrow="Home care"
        title="Hospital-grade care, at home"
        subtitle="Background-checked nurses, physiotherapists, and elderly caregivers. Hourly or full-day plans, with live check-in so you always know they're on the way."
        chips={[
          { icon: ShieldCheck, label: "Background-checked nurses" },
          { icon: CalendarClock, label: "Flexible plans" },
          { icon: MapPin, label: "Live visit tracking" },
        ]}
      />

      <div className="ge-container py-14">
        <h2 className="ge-display mb-6 text-[24px] text-ge-ink">Care services</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Card key={s.title} className="flex flex-col rounded-3xl p-6 transition hover:shadow-card-soft">
              <IconTile icon={s.icon} />
              <h3 className="mt-5 font-display text-[17px] font-semibold text-ge-ink">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ge-muted">{s.body}</p>
              <div className="mt-3 inline-flex items-center gap-1 text-[11.5px] text-ge-muted">
                <Clock className="h-3 w-3" /> {s.durationMin} min visit
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-ge-border pt-4">
                <span className="ge-mono text-[15px] font-semibold text-ge-navy">{formatPkr(s.pricePaisa)}</span>
                <Button asChild size="sm">
                  <Link href={`/login?next=/patient/home-care`}>Request <ArrowRight className="h-3 w-3" /></Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <HowItWorks
        eyebrow="How it works"
        title="Care at home, in three steps"
        steps={[
          { icon: ClipboardList, title: "Request a visit", body: "Choose a service, pick a time, and share the visit address — booked in a minute." },
          { icon: UserCheck, title: "Matched to a nurse", body: "A verified, background-checked caregiver is assigned and confirmed for your slot." },
          { icon: HeartHandshake, title: "Care at your door", body: "Track your nurse on the way and receive professional care at home." },
        ]}
      />
      <FinalCta />
    </div>
  );
}
