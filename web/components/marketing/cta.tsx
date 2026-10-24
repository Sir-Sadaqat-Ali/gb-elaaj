import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, Rings } from "@/components/marketing/bits";

export function FinalCta() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="ge-container">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-ge-primary to-ge-navy px-7 py-16 text-center text-white md:px-14 md:py-20">
          <Rings />
          <div className="relative mx-auto max-w-2xl">
            <Eyebrow onDark>Care for all</Eyebrow>
            <h2 className="ge-display mx-auto mt-5 max-w-xl text-[30px] leading-[38px] text-white md:text-[44px] md:leading-[52px]">
              Expert care from home, whenever you need it
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-white/75">
              Free to sign up. No subscription. Pay only for what you use.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/doctors">Find a doctor</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="border border-white/25 text-white hover:bg-white/10">
                <Link href="/signup?role=doctor">
                  <Stethoscope className="h-4 w-4" /> Join as a doctor
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
