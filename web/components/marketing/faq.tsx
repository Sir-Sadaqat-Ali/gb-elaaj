import { Plus } from "lucide-react";
import { SectionHead } from "@/components/marketing/section-head";

export type FaqItem = { q: string; a: string };

const DEFAULT_ITEMS: FaqItem[] = [
  { q: "How do I book an appointment?", a: "Search for a doctor by specialty or city, pick an open slot, add your symptoms, and confirm. You'll get an instant confirmation and can join by video or visit the clinic." },
  { q: "What do I need for a video consultation?", a: "Just a phone or laptop with a camera and an internet connection. Your video room opens shortly before the appointment time — no app install required." },
  { q: "How can I pay?", a: "You can pay by bank transfer (HBL) at checkout — the account details are shown on the confirmation step. Your booking is reserved while the payment is verified." },
  { q: "How does home lab sample collection work?", a: "Book a lab test, choose home collection, and a phlebotomist visits at your scheduled time. Your digital report is synced to your records, usually within 24–48 hours." },
  { q: "Which areas do you deliver medicines to?", a: "Pharmacy delivery covers Gilgit and major GB towns, expanding across Pakistan. You'll see availability for your address at checkout." },
  { q: "Can I reschedule or cancel?", a: "Yes — you can reschedule or cancel from your appointments page up to one hour before the slot, subject to the doctor's policy." },
];

export function Faq({
  eyebrow = "Questions",
  title = "Everything you need to know",
  items = DEFAULT_ITEMS,
}: {
  eyebrow?: string;
  title?: string;
  items?: FaqItem[];
}) {
  return (
    <section className="bg-ge-blue-tint py-16 md:py-24">
      <div className="ge-container">
        <SectionHead eyebrow={eyebrow} title={title} center />
        <div className="mx-auto max-w-[760px] divide-y divide-ge-border rounded-3xl border border-ge-border bg-white px-6 md:px-8">
          {items.map((it, i) => (
            <details key={it.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start gap-4">
                <span className="ge-mono mt-0.5 text-[13px] font-semibold text-ge-primary">
                  /{String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-display text-[17px] font-medium text-ge-ink">{it.q}</span>
                <Plus className="mt-1 h-4 w-4 shrink-0 text-ge-muted transition-transform group-open:rotate-45" aria-hidden />
              </summary>
              <p className="mt-3 pl-9 pr-8 text-[14px] leading-relaxed text-ge-muted">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
