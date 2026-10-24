import Link from "next/link";
import { ArrowRight, Beaker, Calendar, ShieldCheck, Stethoscope, Truck, Users, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_NAV } from "@/app/(admin)/admin/_nav";
import { Kpi } from "@/components/data/kpi";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { formatPkrCompact, formatPkr, relativeTime } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin · Dashboard" };

export default async function AdminDashboardPage() {
  const session = await requireRole("ADMIN");

  const [users, doctors, appointments, orders, labs, monthRevenue, pendingDoctors, recentTxns] = await Promise.all([
    prisma.user.count(),
    prisma.doctorProfile.count(),
    prisma.appointment.count(),
    prisma.pharmacyOrder.count(),
    prisma.labBooking.count(),
    prisma.transaction.aggregate({
      _sum: { grossPaisa: true, commissionPaisa: true },
      where: { status: "SUCCEEDED", capturedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
    prisma.doctorProfile.findMany({
      where: { verifiedStatus: "PENDING" },
      include: { user: true, specialties: { include: { specialty: true } } },
      take: 5,
    }),
    prisma.transaction.findMany({
      include: { payer: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  const txnCols: Column<(typeof recentTxns)[number]>[] = [
    { key: "id", header: "Txn", cell: (r) => <span className="ge-mono text-[11px]">{r.id.slice(-8).toUpperCase()}</span> },
    { key: "kind", header: "Type", cell: (r) => r.kind },
    { key: "user", header: "User", cell: (r) => r.payer?.name ?? "—" },
    { key: "gross", header: "Gross", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.grossPaisa)}</span> },
    { key: "comm", header: "Commission", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.commissionPaisa)}</span> },
    {
      key: "status", header: "Status", cell: (r) => (
        <StatusChip status={(r.status === "SUCCEEDED" ? "PAID" : r.status === "PENDING" ? "PENDING" : r.status === "REFUNDED" ? "REFUNDED" : "REJECTED") as StatusKind} />
      ),
    },
    { key: "when", header: "When", cell: (r) => <span className="text-[11.5px] text-ge-muted">{relativeTime(r.createdAt)}</span> },
  ];

  return (
    <AppShell
      navItems={ADMIN_NAV}
      user={{ name: me.name, role: "Super Admin", image: me.image }}
      title="Platform overview"
      subtitle="Live metrics across all services · Updated just now"
      search="Search users, transactions…"
    >
      <div className="grid gap-3 md:grid-cols-5">
        <Kpi label="Total users" value={users.toLocaleString()} icon={Users} />
        <Kpi label="Verified doctors" value={doctors.toLocaleString()} icon={Stethoscope} />
        <Kpi label="Appointments" value={appointments.toLocaleString()} icon={Calendar} />
        <Kpi label="Orders" value={orders.toLocaleString()} icon={Truck} />
        <Kpi
          label="Revenue (mo.)"
          value={formatPkrCompact(monthRevenue._sum.grossPaisa ?? 0)}
          icon={Wallet}
          delta={`+${formatPkrCompact(monthRevenue._sum.commissionPaisa ?? 0)} fees`}
          deltaDir="up"
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card className="p-0">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-[14px] font-semibold text-ge-ink">Recent transactions</h2>
            <Button asChild variant="link" size="sm"><Link href="/admin/finance">View all</Link></Button>
          </div>
          <DataTable columns={txnCols} rows={recentTxns} rowKey={(r) => r.id} empty={<div className="p-6 text-center text-sm text-ge-muted">No transactions yet.</div>} />
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-ge-ink">Doctor verification queue</h2>
            <span className="rounded-full bg-[color:var(--ge-warning-bg)] px-2 py-0.5 text-[10.5px] font-semibold text-[color:var(--ge-warning)]">
              {pendingDoctors.length} pending
            </span>
          </div>
          {pendingDoctors.length === 0 ? (
            <div className="mt-4 flex items-center gap-2 rounded-md border border-ge-border bg-ge-soft-bg p-3 text-[12.5px] text-ge-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-ge-success" /> All caught up.
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {pendingDoctors.map((d) => (
                <li key={d.id} className="flex items-center gap-2.5 rounded-md border border-ge-border p-2.5">
                  <Avatar src={d.user.image} name={d.user.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-semibold text-ge-ink">{d.user.name}</div>
                    <div className="text-[11px] text-ge-muted">
                      {d.specialties[0]?.specialty.nameEn ?? "—"} · PMDC {d.pmdcNumber}
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/admin/doctor-verification`}><ArrowRight className="h-3.5 w-3.5" /></Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <Calendar className="h-5 w-5 text-ge-primary" />
          <div className="mt-2 text-[13px] font-semibold text-ge-ink">Appointments</div>
          <div className="text-[11.5px] text-ge-muted">{appointments.toLocaleString()} total · all-time</div>
          <Button asChild variant="link" size="sm" className="mt-2 px-0"><Link href="/admin/appointments">Manage <ArrowRight className="h-3 w-3" /></Link></Button>
        </Card>
        <Card className="p-5">
          <Beaker className="h-5 w-5 text-ge-primary" />
          <div className="mt-2 text-[13px] font-semibold text-ge-ink">Lab bookings</div>
          <div className="text-[11.5px] text-ge-muted">{labs.toLocaleString()} total · all-time</div>
          <Button asChild variant="link" size="sm" className="mt-2 px-0"><Link href="/admin/lab-bookings">Manage <ArrowRight className="h-3 w-3" /></Link></Button>
        </Card>
        <Card className="p-5">
          <Truck className="h-5 w-5 text-ge-primary" />
          <div className="mt-2 text-[13px] font-semibold text-ge-ink">Pharmacy orders</div>
          <div className="text-[11.5px] text-ge-muted">{orders.toLocaleString()} total · all-time</div>
          <Button asChild variant="link" size="sm" className="mt-2 px-0"><Link href="/admin/orders">Manage <ArrowRight className="h-3 w-3" /></Link></Button>
        </Card>
      </div>
    </AppShell>
  );
}
