import { Mail, Phone, MessageCircle } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { IconTile } from "@/components/marketing/bits";

export const metadata = { title: "Contact", description: "Contact Gb Elaaj support — email support@gbelaaj.pk or +92 311 1234567." };

const CHANNELS = [
  { icon: Mail, label: "Email", value: "support@gbelaaj.pk", href: "mailto:support@gbelaaj.pk" },
  { icon: Phone, label: "Phone", value: "+92 311 1234567", href: "tel:+923111234567" },
  { icon: MessageCircle, label: "WhatsApp", value: "Chat with support", href: "https://wa.me/923111234567" },
];

export default function ContactPage() {
  return (
    <div className="bg-white pb-20">
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you"
        subtitle="Reach our support team for help with bookings, refunds, partnerships, or press. We usually reply within a few hours."
      />

      <div className="ge-container py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {CHANNELS.map((c) => (
            <a
              key={c.label}
              href={c.href}
              className="group rounded-3xl border border-ge-border bg-white p-6 transition hover:-translate-y-1 hover:shadow-card-soft"
            >
              <IconTile icon={c.icon} />
              <div className="mt-5 text-[13px] font-semibold text-ge-muted">{c.label}</div>
              <div className="mt-1 text-[16px] font-semibold text-ge-ink group-hover:text-ge-primary">{c.value}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
