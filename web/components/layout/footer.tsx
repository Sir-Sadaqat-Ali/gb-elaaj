import Link from "next/link";
import { Lock, Mail, Phone, Send } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

const GROUPS = [
  {
    title: "For Patients",
    items: [
      { href: "/doctors", label: "Find Doctors" },
      { href: "/lab-tests", label: "Lab Tests" },
      { href: "/pharmacy", label: "Pharmacy" },
      { href: "/home-care", label: "Home Care" },
    ],
  },
  {
    title: "For Providers",
    items: [
      { href: "/signup?role=doctor", label: "Doctor Onboarding" },
      { href: "/signup?role=lab", label: "Lab Partners" },
      { href: "/signup?role=pharmacy", label: "Pharmacy Network" },
    ],
  },
  {
    title: "Company",
    items: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    items: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-ge-navy to-[#06182c] pb-8 pt-20 text-white">
      {/* Giant brand watermark (Curenast footer signature) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-6 select-none text-center ge-display font-semibold leading-none text-white/[.05]"
        style={{ fontSize: "clamp(64px, 15vw, 200px)" }}
      >
        Gb Elaaj
      </span>
      <div className="ge-container relative">
        {/* White card sitting on the navy ground — Curenast footer pattern */}
        <div className="rounded-[32px] bg-white p-7 text-ge-ink shadow-card md:p-10">
          {/* Top strip: brand + headline + CTA */}
          <div className="flex flex-col gap-6 border-b border-ge-border pb-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-md">
              <Logo size={34} />
              <p className="mt-4 text-[14px] leading-relaxed text-ge-muted">
                Your health partner in Gilgit-Baltistan — verified doctors, labs, pharmacy, and home
                nursing, all in one place.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/doctors">Find a doctor</Link>
              </Button>
              <div className="flex gap-2">
                {[
                  { Icon: Phone, label: "Call us" },
                  { Icon: Mail, label: "Email us" },
                  { Icon: Send, label: "Message us" },
                ].map(({ Icon, label }) => (
                  <span
                    key={label}
                    title={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-ge-border bg-ge-soft-bg text-ge-muted"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 pt-8 md:grid-cols-4">
            {GROUPS.map((g) => (
              <div key={g.title}>
                <div className="mb-3 text-[13px] font-semibold text-ge-ink">{g.title}</div>
                <ul className="space-y-2.5">
                  {g.items.map((it) => (
                    <li key={it.href}>
                      <Link href={it.href} className="text-[13.5px] text-ge-muted hover:text-ge-primary">
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar on navy */}
        <div className="mt-6 flex flex-col items-start justify-between gap-2 px-1 text-xs text-white/60 md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} Gb Elaaj Health Technologies (Pvt) Ltd.</span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3 w-3" /> SSL secured · Privacy-first healthcare
          </span>
        </div>
      </div>
    </footer>
  );
}
