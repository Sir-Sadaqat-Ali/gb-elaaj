import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { LAB_NAV } from "@/app/(lab)/lab-admin/_nav";
import { Kpi } from "@/components/data/kpi";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { Beaker, FileText, CheckCircle2, Wallet } from "lucide-react";
import { formatDate, formatPkr, formatPkrCompact } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Lab · Overview" };

export default async function LabDashboardPage() {
  const session = await requireRole("LAB_ADMIN");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { labAdmin: { include: { city: true } } },
  });
  if (!me?.labAdmin) return null;
  const lab = me.labAdmin;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [todays, pendingReports, completedReports, monthRevenue, recent] = await Promise.all([
    prisma.labBooking.count({
      where: { labId: lab.id, scheduledFor: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lte: new Date(new Date().setHours(23, 59, 59, 999)) } },
    }),
    prisma.labBooking.count({ where: { labId: lab.id, status: { in: ["BOOKED", "COLLECTED", "PROCESSING"] } } }),
    prisma.labBooking.count({ where: { labId: lab.id, status: "REPORTED" } }),
    prisma.transaction.aggregate({
      _sum: { grossPaisa: true, netPaisa: true },
      where: { providerRole: "LAB_ADMIN", providerId: lab.id, status: "SUCCEEDED", capturedAt: { gte: monthStart } },
    }),
    prisma.labBooking.findMany({
      where: { labId: lab.id },
      include: { patient: { include: { user: true } }, test: true, report: true },
      orderBy: { scheduledFor: "desc" },
      take: 12,
    }),
  ]);

  const cols: Column<(typeof recent)[number]>[] = [
    { key: "id", header: "Booking", cell: (r) => <span className="ge-mono text-[11.5px]">#{r.id.slice(-6).toUpperCase()}</span> },
    { key: "p", header: "Patient", cell: (r) => r.patient.user.name },
    { key: "test", header: "Test", cell: (r) => r.test.nameEn },
    { key: "mode", header: "Mode", cell: (r) => r.mode },
    { key: "price", header: "Price", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.pricePaisa)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={r.status as StatusKind} /> },
    { key: "when", header: "Scheduled", cell: (r) => formatDate(r.scheduledFor) },
  ];

  return (
    <AppShell
      navItems={LAB_NAV}
      user={{ name: lab.name, role: `${lab.city.nameEn} · Lab`, image: me.image }}
      title="Lab operations"
      subtitle={`${todays} samples scheduled today · ${pendingReports} reports pending`}
      search="Search test, patient, report ID…"
    >
      <div className="grid gap-3 md:grid-cols-4">
        <Kpi label="Today's bookings" value={String(todays)} icon={Beaker} />
        <Kpi label="Reports pending" value={String(pendingReports)} icon={FileText} />
        <Kpi label="Reports completed" value={String(completedReports)} icon={CheckCircle2} />
        <Kpi label="Revenue (mo.)" value={formatPkrCompact(monthRevenue._sum.grossPaisa ?? 0)} icon={Wallet} delta={`${formatPkrCompact(monthRevenue._sum.netPaisa ?? 0)} net`} deltaDir="up" />
      </div>
      <div className="mt-4">
        <Card className="p-0">
          <div className="px-5 py-4">
            <h2 className="text-[14px] font-semibold text-ge-ink">Test bookings</h2>
          </div>
          <DataTable columns={cols} rows={recent} rowKey={(r) => r.id} empty={<p className="p-6 text-center text-sm text-ge-muted">No bookings yet.</p>} />
        </Card>
      </div>
    </AppShell>
  );
}
