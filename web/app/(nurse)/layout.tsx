import { requireRole } from "@/lib/rbac";

export default async function NurseLayout({ children }: { children: React.ReactNode }) {
  await requireRole("NURSE");
  return <>{children}</>;
}
