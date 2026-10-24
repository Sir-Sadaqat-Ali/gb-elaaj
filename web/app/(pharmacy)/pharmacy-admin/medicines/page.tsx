import { Pill } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PHARMACY_NAV } from "@/app/(pharmacy)/pharmacy-admin/_nav";
import { DataTable, type Column } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/data/empty-state";
import { formatPkr } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Rx-required medicines" };

export default async function PharmacyMedicinesPage() {
  const session = await requireRole("PHARMACY_ADMIN");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { pharmacyAdmin: true },
  });
  if (!me?.pharmacyAdmin) return null;

  // Rx-required catalog only — distinct from Inventory (which shows all SKUs).
  // This view is the queue pharmacists check before dispensing scheduled drugs.
  const meds = await prisma.medicine.findMany({
    where: { pharmacyId: me.pharmacyAdmin.id, rxRequired: true, active: true },
    orderBy: [{ stock: "asc" }, { nameGeneric: "asc" }],
  });

  const cols: Column<(typeof meds)[number]>[] = [
    { key: "sku", header: "SKU", cell: (r) => <span className="ge-mono text-[11.5px]">{r.sku}</span> },
    {
      key: "name",
      header: "Medicine",
      cell: (r) => (
        <span>
          <strong>{r.nameBrand ?? r.nameGeneric}</strong>
          <span className="ml-1 text-ge-muted">· {r.nameGeneric}</span>
          {r.strength ? <span className="ml-1 text-ge-muted">({r.strength})</span> : null}
        </span>
      ),
    },
    { key: "manufacturer", header: "Manufacturer", cell: (r) => r.manufacturer ?? "—" },
    {
      key: "stock",
      header: "Stock",
      align: "right",
      cell: (r) => (
        <span className={r.stock <= r.reorderLevel ? "ge-mono font-semibold text-ge-danger" : "ge-mono"}>
          {r.stock}
        </span>
      ),
    },
    { key: "price", header: "Price", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.pricePaisa)}</span> },
    { key: "rx", header: "Class", cell: () => <Badge variant="warning">Rx required</Badge> },
  ];

  return (
    <AppShell
      navItems={PHARMACY_NAV}
      user={{ name: me.name, role: `Pharmacy · ${me.pharmacyAdmin.name}`, image: me.image }}
      title="Rx-required medicines"
      subtitle={`${meds.length} prescription-only SKU${meds.length === 1 ? "" : "s"} in your catalog`}
    >
      {meds.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No Rx-required medicines"
          body="Once you mark a medicine as Rx-required from Inventory, it will appear here for verification before dispensing."
        />
      ) : (
        <DataTable columns={cols} rows={meds} rowKey={(r) => r.id} caption="Verify a valid prescription before dispensing." />
      )}
    </AppShell>
  );
}
