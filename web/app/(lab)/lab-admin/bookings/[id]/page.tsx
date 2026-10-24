import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Beaker } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { LAB_NAV } from "@/app/(lab)/lab-admin/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { LabBookingActions } from "@/components/booking/lab-booking-actions";
import { formatDateTime, formatPkr } from "@/lib/formatting";

export const metadata = { title: "Lab booking" };
export const dynamic = "force-dynamic";

export default async function LabBookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("LAB_ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { labAdmin: true } });
  if (!me?.labAdmin) return null;
  const { id } = await params;
  const booking = await prisma.labBooking.findUnique({
    where: { id },
    include: { test: true, patient: { include: { user: true } }, report: true },
  });
  if (!booking || booking.labId !== me.labAdmin.id) notFound();

  return (
    <AppShell
      navItems={LAB_NAV}
      user={{ name: me.name, role: `Lab · ${me.labAdmin.name}`, image: me.image }}
      title={booking.test.nameEn}
      subtitle={`Booking #${booking.id.slice(-6).toUpperCase()} · ${formatDateTime(booking.scheduledFor)}`}
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link href="/lab-admin/bookings"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-ge-ink">Sample</h2>
            <StatusChip status={booking.status as StatusKind} />
          </div>
          <ul className="mt-3 space-y-1 text-[13px]">
            <Row k="Test" v={booking.test.nameEn} />
            <Row k="Sample type" v={booking.test.sampleType ?? "—"} />
            <Row k="Mode" v={<Badge variant={booking.mode === "HOME" ? "info" : "neutral"}>{booking.mode}</Badge>} />
            <Row k="Scheduled" v={formatDateTime(booking.scheduledFor)} />
            <Row k="Address" v={booking.addressLine ?? "Walk-in"} />
            <Row k="Price" v={<span className="ge-mono">{formatPkr(booking.pricePaisa)}</span>} />
          </ul>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-[13.5px] font-semibold text-ge-ink">Patient</h3>
            <div className="mt-3 flex items-center gap-2.5">
              <Avatar src={booking.patient.user.image} name={booking.patient.user.name} size={36} />
              <div>
                <div className="text-[13px] font-semibold text-ge-ink">{booking.patient.user.name}</div>
                <div className="text-[11px] text-ge-muted">{booking.patient.user.phone ?? booking.patient.user.email}</div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Beaker className="h-4 w-4 text-ge-primary" />
              <h3 className="text-[13.5px] font-semibold text-ge-ink">Update & report</h3>
            </div>
            <p className="mt-1 text-[11.5px] text-ge-muted">Move the sample through your pipeline. Upload the result when ready.</p>
            <div className="mt-3">
              <LabBookingActions bookingId={booking.id} status={booking.status} hasReport={!!booking.report} />
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-ge-muted">{k}</span>
      <span className="font-medium text-ge-ink">{v}</span>
    </li>
  );
}
