import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatPkr } from "@/lib/formatting";

/** Mobile-only fixed booking bar on the doctor profile. Hidden on md+. */
export function StickyBookBar({ slug, feePaisa, name }: { slug: string; feePaisa: number; name: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ge-border bg-white/95 px-4 py-3 shadow-card backdrop-blur md:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] text-ge-muted">Consultation with {name.split(" ")[0]}</div>
          <div className="ge-mono text-[15px] font-semibold text-ge-navy">{formatPkr(feePaisa)}</div>
        </div>
        <Button asChild size="lg">
          <Link href={`/doctor/${slug}/book`}>Book appointment</Link>
        </Button>
      </div>
    </div>
  );
}
