import Link from "next/link";
import { Beaker, Clock, MapPin, ArrowRight, Home, FileText, MousePointerClick, TestTube, FileCheck2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/marketing/page-hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FinalCta } from "@/components/marketing/cta";
import { IconTile } from "@/components/marketing/bits";
import { formatPkr } from "@/lib/formatting";

export const metadata = { title: "Lab tests at home", description: "Browse diagnostic tests from verified labs across Gilgit-Baltistan. Home sample collection. Digital reports in hours." };

export const revalidate = 60;

export default async function LabTestsPage() {
  const tests = await prisma.labTest.findMany({
    where: { active: true },
    include: { lab: { include: { city: true } } },
    orderBy: { nameEn: "asc" },
  });

  return (
    <div className="bg-white pb-4">
      <PageHero
        eyebrow="Lab tests"
        title="Lab tests, sampled at your doorstep"
        subtitle="Verified partner labs across Gilgit-Baltistan. Home sample collection and digital reports synced straight to your records."
        chips={[
          { icon: Home, label: "Free home sampling" },
          { icon: Clock, label: "Reports in 24–48h" },
          { icon: FileText, label: "Synced to your records" },
        ]}
      />

      <div className="ge-container py-14">
        <h2 className="ge-display mb-6 text-[24px] text-ge-ink">Popular tests</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tests.map((t) => (
            <Card key={t.id} className="flex flex-col rounded-3xl p-6 transition hover:shadow-card-soft">
              <div className="flex items-start gap-3">
                <IconTile icon={Beaker} size="sm" />
                <div className="flex-1">
                  <h3 className="text-[15px] font-semibold text-ge-ink">{t.nameEn}</h3>
                  <p className="text-[11.5px] text-ge-muted">{t.lab.name} · {t.lab.city.nameEn}</p>
                </div>
                {t.homeEligible && <Badge variant="info">Home</Badge>}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[11.5px] text-ge-muted">
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {t.turnaroundHrs}h</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {t.sampleType ?? "—"}</span>
                {t.fastingRequired && <Badge variant="warning">Fasting</Badge>}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-ge-border pt-4">
                <span className="ge-mono text-[15px] font-semibold text-ge-navy">{formatPkr(t.pricePaisa)}</span>
                <Button asChild size="sm">
                  <Link href={`/login?next=/patient/lab-tests`}>Book <ArrowRight className="h-3 w-3" /></Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <HowItWorks
        eyebrow="How it works"
        title="From booking to report, in three steps"
        steps={[
          { icon: MousePointerClick, title: "Choose a test", body: "Pick from verified partner labs and book a home-collection slot that suits you." },
          { icon: TestTube, title: "Home sample collection", body: "A trained phlebotomist visits at your scheduled time to collect the sample." },
          { icon: FileCheck2, title: "Digital report", body: "Your report is delivered to your records in 24–48 hours, ready to share with your doctor." },
        ]}
      />
      <FinalCta />
    </div>
  );
}
