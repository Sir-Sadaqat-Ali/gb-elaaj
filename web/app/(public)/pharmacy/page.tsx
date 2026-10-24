import Link from "next/link";
import { Pill, ArrowRight, Truck, BadgeCheck, Upload, Search, ClipboardCheck, PackageCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/marketing/page-hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FinalCta } from "@/components/marketing/cta";
import { IconTile } from "@/components/marketing/bits";
import { formatPkr } from "@/lib/formatting";

export const metadata = { title: "Online pharmacy", description: "Buy genuine medicines from verified pharmacies. Home delivery in Gilgit-Baltistan. Upload a prescription for Rx-required items." };

export const revalidate = 60;

export default async function PharmacyPage() {
  const meds = await prisma.medicine.findMany({
    where: { active: true, stock: { gt: 0 } },
    include: { pharmacy: { include: { city: true } } },
    orderBy: { nameGeneric: "asc" },
    take: 24,
  });

  return (
    <div className="bg-white pb-4">
      <PageHero
        eyebrow="Online pharmacy"
        title="Genuine medicines, delivered to your door"
        subtitle="Browse a verified catalog from licensed pharmacies. Upload a prescription for Rx-only medicines and pay easily at checkout."
        chips={[
          { icon: BadgeCheck, label: "Verified pharmacies" },
          { icon: Truck, label: "Home delivery" },
          { icon: Upload, label: "Prescription upload" },
        ]}
      />

      <div className="ge-container py-14">
        <h2 className="ge-display mb-6 text-[24px] text-ge-ink">Browse medicines</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {meds.map((m) => (
            <Card key={m.id} className="flex flex-col rounded-3xl p-5 transition hover:shadow-card-soft">
              <div className="flex items-start gap-3">
                <IconTile icon={Pill} size="sm" />
                <div className="flex-1">
                  <h3 className="text-[14px] font-semibold text-ge-ink">{m.nameBrand ?? m.nameGeneric}</h3>
                  <p className="text-[11.5px] text-ge-muted">{m.nameGeneric} · {m.strength}</p>
                  <p className="text-[11px] text-ge-muted">{m.pharmacy.name} · {m.pharmacy.city.nameEn}</p>
                </div>
                {m.rxRequired && <Badge variant="warning">Rx</Badge>}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-ge-border pt-4">
                <div>
                  <span className="ge-mono text-[14px] font-semibold text-ge-navy">{formatPkr(m.pricePaisa)}</span>
                  {m.mrpPaisa > m.pricePaisa && (
                    <span className="ml-1.5 text-[11px] text-ge-muted line-through">{formatPkr(m.mrpPaisa)}</span>
                  )}
                </div>
                <Button asChild size="sm">
                  <Link href={`/login?next=/patient/pharmacy`}>Add <ArrowRight className="h-3 w-3" /></Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <HowItWorks
        eyebrow="How it works"
        title="Order medicines in three steps"
        steps={[
          { icon: Search, title: "Find your medicine", body: "Search the verified catalog or upload a doctor's prescription for Rx items." },
          { icon: ClipboardCheck, title: "Confirm & pay", body: "Review your cart, add your delivery address, and pay easily by bank transfer." },
          { icon: PackageCheck, title: "Delivered to you", body: "Genuine medicines arrive at your door, with delivery across Gilgit-Baltistan." },
        ]}
      />
      <FinalCta />
    </div>
  );
}
