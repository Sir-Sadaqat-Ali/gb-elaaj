export const metadata = {
  title: "Privacy Policy",
  description: "How Gb Elaaj collects, uses, and protects your medical data.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-white">
      <div className="ge-container max-w-3xl py-16">
        <h1 className="ge-display text-[40px] font-semibold text-ge-ink">Privacy Policy</h1>
        <p className="mt-3 text-sm text-ge-muted">Last updated: May 2026</p>
        <div className="prose mt-6 max-w-none text-[14.5px] leading-relaxed text-ge-ink">
          <p>
            Gb Elaaj treats medical data with the highest standard of care. Your records are encrypted at rest. Access is
            restricted by role and audited. You can request export or deletion at any time from Settings.
          </p>
          <h2 className="mt-6 text-lg font-semibold text-ge-ink">What we collect</h2>
          <ul>
            <li>Account details: name, phone, email, password (hashed).</li>
            <li>Medical records you create or receive: prescriptions, lab reports, vitals, attachments.</li>
            <li>Transaction history of consultations, orders, and bookings.</li>
          </ul>
          <h2 className="mt-6 text-lg font-semibold text-ge-ink">How we use it</h2>
          <ul>
            <li>To deliver the service you booked.</li>
            <li>To notify you about appointments, deliveries, and reports.</li>
            <li>For audit and compliance only — never sold to advertisers.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
