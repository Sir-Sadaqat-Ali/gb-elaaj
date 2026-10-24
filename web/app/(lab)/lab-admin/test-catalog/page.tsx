import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { LAB_NAV } from "@/app/(lab)/lab-admin/_nav";
import { DataTable, type Column } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { formatPkr } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Test catalog" };

export default async function LabTestCatalogPage() {
  const session = await requireRole("LAB_ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { labAdmin: true } });
  if (!me?.labAdmin) return null;

  const tests = await prisma.labTest.findMany({ where: { labId: me.labAdmin.id }, orderBy: { nameEn: "asc" } });

  const cols: Column<(typeof tests)[number]>[] = [
    { key: "name", header: "Test", cell: (r) => <strong>{r.nameEn}</strong> },
    { key: "sample", header: "Sample", cell: (r) => r.sampleType ?? "—" },
    { key: "fast", header: "Fasting", cell: (r) => r.fastingRequired ? <Badge variant="warning">Required</Badge> : <Badge>Not required</Badge> },
    { key: "tat", header: "Turnaround", cell: (r) => `${r.turnaroundHrs}h` },
    { key: "home", header: "Home", cell: (r) => r.homeEligible ? <Badge variant="success">Yes</Badge> : <Badge>No</Badge> },
    { key: "price", header: "Price", align: "right", cell: (r) => <span className="ge-mono">{formatPkr(r.pricePaisa)}</span> },
  ];

  return (
    <AppShell navItems={LAB_NAV} user={{ name: me.name, role: `Lab · ${me.labAdmin.name}`, image: me.image }} title="Test catalog" subtitle={`${tests.length} tests offered`}>
      <DataTable columns={cols} rows={tests} rowKey={(r) => r.id} />
    </AppShell>
  );
}
