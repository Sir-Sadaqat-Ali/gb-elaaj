import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Pill } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PHARMACY_NAV } from "@/app/(pharmacy)/pharmacy-admin/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { OrderStatusActions } from "@/components/booking/order-status-actions";
import { formatPkr, formatDateTime } from "@/lib/formatting";

export const metadata = { title: "Order detail" };
export const dynamic = "force-dynamic";

export default async function PharmacyOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("PHARMACY_ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { pharmacyAdmin: true } });
  if (!me?.pharmacyAdmin) return null;
  const { id } = await params;
  const order = await prisma.pharmacyOrder.findUnique({
    where: { id },
    include: { patient: { include: { user: true } }, items: { include: { medicine: true } } },
  });
  if (!order || order.pharmacyId !== me.pharmacyAdmin.id) notFound();

  return (
    <AppShell
      navItems={PHARMACY_NAV}
      user={{ name: me.name, role: `Pharmacy · ${me.pharmacyAdmin.name}`, image: me.image }}
      title={`Order #${order.id.slice(-6).toUpperCase()}`}
      subtitle={`From ${order.patient.user.name} · ${formatDateTime(order.createdAt)}`}
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link href="/pharmacy-admin/orders"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-ge-ink">Items</h2>
            <StatusChip status={order.status as StatusKind} />
          </div>
          <ul className="mt-3 divide-y divide-ge-border">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ge-soft-bg text-ge-primary">
                  <Pill className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-ge-ink">{it.medicine.nameBrand ?? it.medicine.nameGeneric}</div>
                  <div className="text-[11px] text-ge-muted">{it.medicine.strength ?? "—"} · qty {it.qty}</div>
                </div>
                <span className="ge-mono text-[13px]">{formatPkr(it.totalPaisa)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-ge-border pt-3 text-[13px]">
            <span className="text-ge-muted">Total</span>
            <span className="ge-mono text-base font-semibold text-ge-navy">{formatPkr(order.totalPaisa)}</span>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-[13.5px] font-semibold text-ge-ink">Customer</h3>
            <div className="mt-2 flex items-center gap-2.5">
              <Avatar src={order.patient.user.image} name={order.patient.user.name} size={36} />
              <div>
                <div className="text-[13px] font-semibold text-ge-ink">{order.patient.user.name}</div>
                <div className="text-[11px] text-ge-muted">{order.patient.user.phone ?? order.patient.user.email}</div>
              </div>
            </div>
            <div className="mt-3 text-[12px] text-ge-ink">{order.addressLine}</div>
            <div className="text-[11px] text-ge-muted">{order.cityName}</div>
          </Card>

          {order.prescriptionKey && (
            <Card className="p-5">
              <h3 className="text-[13.5px] font-semibold text-ge-ink">Prescription</h3>
              <p className="mt-1 text-[11.5px] text-ge-muted">Verify before fulfillment.</p>
              <Button asChild variant="secondary" size="sm" className="mt-3">
                <Link
                  href={`/api/files/${order.id}/download?kind=prescription`}
                  target="_blank"
                  rel="noopener"
                >
                  Open Rx <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="text-[13.5px] font-semibold text-ge-ink">Update status</h3>
            <p className="mt-1 text-[11.5px] text-ge-muted">Customer is notified automatically on each transition.</p>
            <div className="mt-3">
              <OrderStatusActions orderId={order.id} current={order.status} />
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
