import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_NAV } from "@/app/(admin)/admin/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/data/empty-state";
import { ShieldCheck } from "lucide-react";
import { VerificationDecision } from "@/components/booking/verification-decision";
import { formatDate } from "@/lib/formatting";

export const metadata = { title: "Doctor verification" };
export const dynamic = "force-dynamic";

export default async function AdminDoctorVerificationPage() {
  const session = await requireRole("ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  const cases = await prisma.doctorProfile.findMany({
    include: { user: true, specialties: { include: { specialty: true } }, city: true },
    orderBy: [{ verifiedStatus: "asc" }, { createdAt: "desc" }],
  });

  const pending = cases.filter((c) => c.verifiedStatus === "PENDING");
  const decided = cases.filter((c) => c.verifiedStatus !== "PENDING");

  return (
    <AppShell
      navItems={ADMIN_NAV}
      user={{ name: me.name, role: "Super Admin", image: me.image }}
      title="Doctor verification"
      subtitle={`${pending.length} pending review`}
    >
      {pending.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="All caught up" body="No pending doctor verifications." />
      ) : (
        <div className="space-y-3">
          {pending.map((d) => (
            <Card key={d.id} className="flex flex-wrap items-center gap-3 p-4">
              <Avatar src={d.user.image} name={d.user.name} size={40} />
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-ge-ink">{d.user.name}</div>
                <div className="text-[11.5px] text-ge-muted">
                  {d.specialties[0]?.specialty.nameEn} · PMDC {d.pmdcNumber} · {d.city.nameEn}
                </div>
                <div className="text-[10.5px] text-ge-muted">Submitted {formatDate(d.createdAt)}</div>
              </div>
              <VerificationDecision doctorId={d.id} />
            </Card>
          ))}
        </div>
      )}

      <h2 className="mt-8 text-[14px] font-semibold text-ge-ink">Recent decisions</h2>
      <div className="mt-3 space-y-2">
        {decided.slice(0, 8).map((d) => (
          <Card key={d.id} className="flex items-center gap-3 p-3">
            <Avatar src={d.user.image} name={d.user.name} size={32} />
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium text-ge-ink">{d.user.name}</div>
              <div className="text-[10.5px] text-ge-muted">{d.specialties[0]?.specialty.nameEn}</div>
            </div>
            <Badge variant={d.verifiedStatus === "APPROVED" ? "success" : "danger"}>{d.verifiedStatus}</Badge>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
