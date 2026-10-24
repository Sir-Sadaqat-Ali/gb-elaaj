import { requireRole } from "@/lib/rbac";

export default async function PharmacyAdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("PHARMACY_ADMIN");
  return <>{children}</>;
}
