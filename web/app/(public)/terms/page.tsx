export const metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of the Gb Elaaj healthcare marketplace.",
};

export default function TermsPage() {
  return (
    <div className="bg-white">
      <div className="ge-container max-w-3xl py-16">
        <h1 className="ge-display text-[40px] font-semibold text-ge-ink">Terms of Service</h1>
        <p className="mt-3 text-sm text-ge-muted">Last updated: May 2026</p>
        <div className="mt-6 space-y-4 text-[14.5px] leading-relaxed text-ge-ink">
          <p>
            By using Gb Elaaj you agree to abide by these terms. The platform is a marketplace that connects patients with
            independent verified providers (doctors, pharmacies, labs, nurses). Gb Elaaj does not itself provide medical
            services and is not liable for the medical opinion or services rendered by providers.
          </p>
          <h2 className="mt-4 text-lg font-semibold text-ge-ink">Refunds and cancellations</h2>
          <p>
            Appointments may be cancelled up to 1 hour before the scheduled time for a full refund. After that window, refunds
            are at the discretion of the provider and platform.
          </p>
          <h2 className="mt-4 text-lg font-semibold text-ge-ink">Limitation of liability</h2>
          <p>
            For severe symptoms or emergencies, please call 1122 or visit the nearest emergency room. Gb Elaaj is not a
            substitute for emergency care.
          </p>
        </div>
      </div>
    </div>
  );
}
