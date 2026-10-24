import Link from "next/link";
import { Calendar, Wallet, Star, Bell, Video, Building, Stethoscope } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { DOCTOR_NAV } from "@/app/(doctor)/doctor/_nav";
import { Kpi } from "@/components/data/kpi";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPkr, formatPkrCompact, formatTime, formatDate } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Doctor · Today" };

export default async function DoctorDashboardPage() {
  const session = await requireRole("DOCTOR");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { doctor: { include: { specialties: { include: { specialty: true } } } } },
  });
  if (!me?.doctor) return null;

  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
  const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const [todays, weekEarnings, monthEarnings, ratingAvg, todayCount] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId: me.doctor.id,
        scheduledFor: { gte: startOfDay, lte: endOfDay },
      },
      include: { patient: { include: { user: true } } },
      orderBy: { scheduledFor: "asc" },
    }),
    prisma.transaction.aggregate({
      _sum: { netPaisa: true },
      where: { providerRole: "DOCTOR", providerId: me.doctor.id, status: "SUCCEEDED", capturedAt: { gte: startOfWeek } },
    }),
    prisma.transaction.aggregate({
      _sum: { netPaisa: true },
      where: { providerRole: "DOCTOR", providerId: me.doctor.id, status: "SUCCEEDED", capturedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
    Promise.resolve(me.doctor.ratingAvg),
    prisma.appointment.count({ where: { doctorId: me.doctor.id, scheduledFor: { gte: startOfDay, lte: endOfDay } } }),
  ]);

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthCompleted = await prisma.appointment.count({
    where: { doctorId: me.doctor.id, status: "COMPLETED", scheduledFor: { gte: monthStart } },
  });

  const cols: Column<(typeof todays)[number]>[] = [
    { key: "time", header: "Time", cell: (r) => <span className="ge-mono text-[12.5px] font-semibold">{formatTime(r.scheduledFor)}</span> },
    {
      key: "patient", header: "Patient", cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar src={r.patient.user.image} name={r.patient.user.name} size={28} />
          <span className="text-[12.5px]">{r.patient.user.name}</span>
        </div>
      ),
    },
    { key: "reason", header: "Reason", cell: (r) => <span className="text-[12px] text-ge-muted">{r.symptoms ?? "—"}</span> },
    {
      key: "mode", header: "Mode", cell: (r) => (
        <Badge variant={r.mode === "VIDEO" ? "info" : "neutral"} className="gap-1">
          {r.mode === "VIDEO" ? <Video className="h-3 w-3" /> : <Building className="h-3 w-3" />} {r.mode === "VIDEO" ? "Video" : "Clinic"}
        </Badge>
      ),
    },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={r.status as StatusKind} /> },
  ];

  return (
    <AppShell
      navItems={DOCTOR_NAV}
      user={{ name: me.name, role: `${me.doctor.specialties[0]?.specialty.nameEn ?? "Doctor"} · PMDC`, image: me.image }}
      title="Today's clinic"
      subtitle={`${formatDate(new Date(), { weekday: "long", month: "long", day: "numeric" })} · ${todayCount} appointments scheduled`}
      search="Search patients, prescriptions…"
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Today's appointments" value={String(todayCount)} icon={Calendar} />
        <Kpi label="Completed (mo.)" value={String(monthCompleted)} icon={Bell} hint="Consults this month" />
        <Kpi label="This week earnings" value={formatPkrCompact(weekEarnings._sum.netPaisa ?? 0)} icon={Wallet} delta={formatPkrCompact(monthEarnings._sum.netPaisa ?? 0) + " mo"} deltaDir="up" />
        <Kpi label="Patient rating" value={`${ratingAvg.toFixed(1)} ★`} icon={Star} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card className="p-0">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-[14px] font-semibold text-ge-ink">Today's schedule</h2>
            <Button asChild variant="link" size="sm"><Link href="/doctor/appointments">View all</Link></Button>
          </div>
          <DataTable
            columns={cols}
            rows={todays}
            rowKey={(r) => r.id}
            empty={<div className="p-8 text-center text-sm text-ge-muted">No appointments scheduled today.</div>}
          />
        </Card>
        <div className="space-y-4">
          <Card className="bg-ge-navy p-5 text-white">
            <div className="text-[12px] text-white/70">This month</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight">{formatPkrCompact(monthEarnings._sum.netPaisa ?? 0)}</div>
            <div className="mt-1 text-[11px] text-ge-primary-3">Net earnings after platform commission</div>
            <Button asChild className="mt-3 bg-white text-ge-primary hover:bg-white/90" size="sm">
              <Link href="/doctor/earnings"><Wallet className="h-3.5 w-3.5" /> Earnings</Link>
            </Button>
          </Card>
          <Card className="p-5">
            <h3 className="text-[13px] font-semibold text-ge-ink">Profile health</h3>
            <p className="mt-1 text-[11.5px] text-ge-muted">Keep your public profile fresh to rank higher in search.</p>
            <Button asChild variant="secondary" size="sm" className="mt-3">
              <Link href="/doctor/public-profile"><Stethoscope className="h-3.5 w-3.5" /> Edit profile</Link>
            </Button>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
