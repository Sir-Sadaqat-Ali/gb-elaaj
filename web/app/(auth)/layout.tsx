import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="grid min-h-screen md:grid-cols-2">
        <div className="flex items-center justify-center px-6 py-10 md:px-12">
          <div className="w-full max-w-md">
            <Logo size={32} />
            <div className="mt-10">{children}</div>
          </div>
        </div>
        <aside className="hidden md:block">
          <div
            className="flex h-full flex-col justify-between bg-ge-navy p-12 text-white"
            style={{
              backgroundImage:
                "radial-gradient(60% 50% at 80% 0%, rgba(11,132,254,.30) 0%, transparent 60%), linear-gradient(180deg,var(--ge-navy) 0%,var(--ge-ink) 100%)",
            }}
          >
            <div>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90">
                Care for All
              </span>
              <h2 className="ge-display mt-4 text-4xl font-semibold leading-tight">
                Health that travels with you.
              </h2>
              <p className="mt-3 max-w-md text-sm text-white/75">
                Verified doctors, lab tests at home, online pharmacy, and home nursing — from Hunza to Karachi.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 text-sm">
              <Stat label="Verified doctors" value="12.4K+" />
              <Stat label="Patients served" value="380K+" />
              <Stat label="Cities covered" value="8" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-3">
      <div className="text-base font-semibold tracking-tight">{value}</div>
      <div className="mt-0.5 text-[11px] text-white/65">{label}</div>
    </div>
  );
}
