import { requireRole } from "@/lib/rbac";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  await requireRole("PATIENT");
  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="md:pb-0 pb-16 overflow-x-hidden">
        {children}
      </div>
      <MobileTabBar />
    </div>
  );
}
