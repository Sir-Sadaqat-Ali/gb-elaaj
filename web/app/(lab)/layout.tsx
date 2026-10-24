import { requireRole } from "@/lib/rbac";

export default async function LabAdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("LAB_ADMIN");
  return <>{children}</>;
}
