import { requireRole } from "@/lib/rbac";

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  await requireRole("FINANCE");
  return <>{children}</>;
}
