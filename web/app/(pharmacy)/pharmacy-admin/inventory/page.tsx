import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PHARMACY_NAV } from "@/app/(pharmacy)/pharmacy-admin/_nav";
import { DataTable, type Column } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { formatPkr } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Inventory" };

export default async function PharmacyInventoryPage() {
  const session = await requireRole("PHARMACY_ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { pharmacyAdmin: true } });
  if (!me?.pharmacyAdmin) return null;

  const meds = await prisma.medicine.findMany({ where: { pharmacyId: me.pharmacyAdmin.id }, orderBy: { stock: "asc" } });

  const cols: Column<(typeof meds)[number]>[] = [
    { key: "sku", header: "SKU", cell: (r) => <span className="ge-mono text-[11.5px]">{r.sku}</span> },
    { key: "name", header: "Medicine", cell: (r) => <span><strong>{r.nameBrand ?? r.nameGeneric}</strong> · <span className="text-ge-muted">{r.nameGeneric}</span></span> },
    { key: "strength", header: "Strength", cell: (r) => r.strength ?? "—" },
    { key: "stock", header: "Stock", align: "right", cell: (r) => (
      <span className={r.stock <= r.reorderLevel ? "ge-mono text-ge-danger font-semibold" : "ge-mono"}>{r.stock}</span>
    ) },
    { key: "price", header: "Price", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.pricePaisa)}</span> },
    { key: "rx", header: "Rx", cell: (r) => r.rxRequired ? <Badge variant="warning">Rx</Badge> : <Badge>OTC</Badge> },
  ];

  return (
    <AppShell navItems={PHARMACY_NAV} user={{ name: me.name, role: `Pharmacy · ${me.pharmacyAdmin.name}`, image: me.image }} title="Inventory" subtitle={`${meds.length} SKUs · stock-managed`}>
      <DataTable columns={cols} rows={meds} rowKey={(r) => r.id} />
    </AppShell>
  );
}
