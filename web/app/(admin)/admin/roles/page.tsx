import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_NAV } from "@/app/(admin)/admin/_nav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const MATRIX = [
  { cap: "Sign up publicly", roles: ["PATIENT"] },
  { cap: "Read own records", roles: ["PATIENT"] },
  { cap: "Issue prescription", roles: ["DOCTOR"] },
  { cap: "Verify Rx", roles: ["PHARMACY_ADMIN"] },
  { cap: "Upload lab report", roles: ["LAB_ADMIN"] },
  { cap: "Visit log", roles: ["NURSE"] },
  { cap: "Approve withdrawals", roles: ["FINANCE", "ADMIN"] },
  { cap: "Approve doctor verification", roles: ["ADMIN"] },
  { cap: "Edit commission rate", roles: ["ADMIN"] },
  { cap: "Suspend user", roles: ["ADMIN"] },
];

export const metadata = { title: "Roles & permissions" };

export default async function AdminRolesPage() {
  const session = await requireRole("ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  return (
    <AppShell navItems={ADMIN_NAV} user={{ name: me.name, role: "Super Admin", image: me.image }} title="Roles & permissions" subtitle="Capability matrix across the seven roles.">
      <Card className="p-6">
        <ul className="divide-y divide-ge-border">
          {MATRIX.map((m) => (
            <li key={m.cap} className="flex items-center justify-between py-3">
              <span className="text-[13px] text-ge-ink">{m.cap}</span>
              <span className="flex flex-wrap gap-1">
                {m.roles.map((r) => (
                  <Badge key={r} variant="info">{r}</Badge>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </AppShell>
  );
}
