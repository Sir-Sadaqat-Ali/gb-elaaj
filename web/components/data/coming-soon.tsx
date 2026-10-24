import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ComingSoon({
  title,
  description,
  phase,
  cta,
}: {
  title: string;
  description: string;
  phase: 2 | 3 | 4;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-xl p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ge-soft-bg text-ge-primary">
          <Sparkles className="h-5 w-5" />
        </span>
        <h2 className="mt-4 ge-display text-[22px] font-semibold text-ge-navy">{title}</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ge-muted">{description}</p>
        <p className="mt-3 inline-flex items-center gap-1 rounded-full border border-ge-border bg-ge-soft-bg px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ge-primary">
          Phase {phase}
        </p>
        {cta && (
          <Button asChild className="mt-4" size="sm">
            <Link href={cta.href}>
              {cta.label} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </Card>
    </div>
  );
}
