import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { NURSE_NAV } from "@/app/(nurse)/nurse/_nav";
import { Kpi } from "@/components/data/kpi";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Clock, Wallet, MapPin } from "lucide-react";
import { formatTime, formatDate, formatPkrCompact } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nurse · Today" };

export default async function NurseDashboardPage() {
  const session = await requireRole("NURSE");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { nurseProfile: { include: { city: true } } },
  });
  if (!me?.nurseProfile) return null;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [todays, completed, monthAgg] = await Promise.all([
    prisma.homeCareRequest.findMany({
      where: {
        nurseId: me.nurseProfile.id,
        scheduledFor: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lte: new Date(new Date().setHours(23, 59, 59, 999)) },
      },
      include: { patient: { include: { user: true } } },
      orderBy: { scheduledFor: "asc" },
    }),
    prisma.homeCareRequest.count({ where: { nurseId: me.nurseProfile.id, status: "COMPLETED" } }),
    prisma.transaction.aggregate({
      _sum: { netPaisa: true },
      where: { providerRole: "NURSE", providerId: me.nurseProfile.id, status: "SUCCEEDED", capturedAt: { gte: monthStart } },
    }),
  ]);

  const startOfWeek = new Date();
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const weekVisits = await prisma.homeCareRequest.count({
    where: {
      nurseId: me.nurseProfile.id,
      status: "COMPLETED",
      scheduledFor: { gte: startOfWeek },
    },
  });

  return (
    <AppShell
      navItems={NURSE_NAV}
      user={{ name: me.name, role: `${me.nurseProfile.level === "SENIOR" ? "Senior" : "Junior"} · ${me.nurseProfile.city.nameEn}`, image: me.image }}
      title="Today's visits"
      subtitle={`${todays.length} assignments scheduled`}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <Kpi label="Today" value={String(todays.length)} icon={Calendar} />
        <Kpi label="Completed lifetime" value={String(completed)} icon={CheckCircle2} />
        <Kpi label="Visits this week" value={String(weekVisits)} icon={Clock} />
        <Kpi label="Earnings (mo.)" value={formatPkrCompact(monthAgg._sum.netPaisa ?? 0)} icon={Wallet} />
      </div>

      <div className="mt-4">
        <Card className="p-5">
          <h2 className="text-[14px] font-semibold text-ge-ink">Today's assignments</h2>
          {todays.length === 0 ? (
            <p className="mt-3 text-sm text-ge-muted">No assignments today. Enjoy your day off.</p>
          ) : (
            <ul className="mt-3 divide-y divide-ge-border">
              {todays.map((v) => (
                <li key={v.id} className="flex items-center gap-3 py-3">
                  <div className="w-14 text-center">
                    <div className="ge-mono text-[12px] font-semibold">{formatTime(v.scheduledFor)}</div>
                    <div className="text-[10px] text-ge-muted">{v.durationMin}m</div>
                  </div>
                  <Avatar src={v.patient.user.image} name={v.patient.user.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-medium text-ge-ink">{v.patient.user.name}</div>
                    <div className="text-[11px] text-ge-muted">
                      {v.serviceName} · <MapPin className="inline h-3 w-3" /> {v.addressLine}
                    </div>
                  </div>
                  <StatusChip status={v.status as StatusKind} />
                  {v.status === "ASSIGNED" && <Button size="sm">Navigate</Button>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
