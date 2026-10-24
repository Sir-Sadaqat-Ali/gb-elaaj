import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pill, RotateCcw } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PATIENT_NAV } from "@/app/(patient)/patient/_nav";
import { Card } from "@/components/ui/card";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { formatPkr, formatDateTime } from "@/lib/formatting";

export const metadata = { title: "Order" };
export const dynamic = "force-dynamic";

export default async function PatientOrderDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const session = await requireRole("PATIENT");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { patient: true } });
  if (!me?.patient) return null;
  const { id } = await params;
  const { placed } = await searchParams;
  const order = await prisma.pharmacyOrder.findUnique({
    where: { id },
    include: { pharmacy: true, items: { include: { medicine: true } } },
  });
  if (!order || order.patientId !== me.patient.id) notFound();

  return (
    <AppShell
      navItems={PATIENT_NAV}
      user={{ name: me.name, role: "Patient", image: me.image }}
      title={`Order #${order.id.slice(-6).toUpperCase()}`}
      subtitle={`${order.pharmacy.name} · ${formatDateTime(order.createdAt)}`}
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/patient/pharmacy"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/patient/pharmacy?reorder=${order.id}`}><RotateCcw className="h-3.5 w-3.5" /> Reorder</Link>
          </Button>
        </div>
      }
    >
      {placed === "1" && (
        <div className="mb-4 rounded-md border border-[color:var(--ge-success-border)] bg-[color:var(--ge-success-bg)] p-3 text-[13px] text-[color:var(--ge-success)]">
          Order placed — you&apos;ll receive an SMS when it ships.
        </div>
      )}

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
                  <div className="text-[13px] font-medium text-ge-ink">
                    {it.medicine.nameBrand ?? it.medicine.nameGeneric}
                  </div>
                  <div className="text-[11px] text-ge-muted">
                    {it.medicine.nameGeneric} · {it.medicine.strength ?? "—"} · qty {it.qty}
                  </div>
                </div>
                <span className="ge-mono text-[13px] font-semibold">{formatPkr(it.totalPaisa)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-[13.5px] font-semibold text-ge-ink">Summary</h3>
            <ul className="mt-2 space-y-1 text-[12.5px]">
              <Row label="Subtotal" value={formatPkr(order.subtotalPaisa)} />
              <Row label="Delivery" value={formatPkr(order.deliveryPaisa)} />
              <li className="my-2 h-px bg-ge-border" />
              <Row label="Total" value={<span className="text-base font-semibold text-ge-navy">{formatPkr(order.totalPaisa)}</span>} />
            </ul>
          </Card>
          <Card className="p-5">
            <h3 className="text-[13.5px] font-semibold text-ge-ink">Delivery</h3>
            <p className="mt-1 text-[12.5px] text-ge-ink">{order.addressLine}</p>
            <p className="text-[11px] text-ge-muted">{order.cityName}</p>
            {order.prescriptionKey && (
              <p className="mt-3 text-[11.5px]">
                <Link
                  href={`/api/files/${order.id}/download?kind=prescription`}
                  className="text-ge-primary hover:underline"
                  target="_blank"
                  rel="noopener"
                >
                  View attached prescription
                </Link>
              </p>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-ge-muted">{label}</span>
      <span className="ge-mono text-ge-ink">{value}</span>
    </li>
  );
}
