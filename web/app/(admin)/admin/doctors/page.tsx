import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_NAV } from "@/app/(admin)/admin/_nav";
import { DataTable, type Column } from "@/components/data/data-table";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatPkr } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin · Doctors" };

export default async function AdminDoctorsPage() {
  const session = await requireRole("ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  const doctors = await prisma.doctorProfile.findMany({
    include: { user: true, city: true, specialties: { include: { specialty: true } } },
    orderBy: { ratingAvg: "desc" },
  });

  const cols: Column<(typeof doctors)[number]>[] = [
    {
      key: "doctor", header: "Doctor", cell: (d) => (
        <div className="flex items-center gap-2.5">
          <Avatar src={d.user.image} name={d.user.name} size={32} />
          <div>
            <div className="text-[12.5px] font-medium text-ge-ink">{d.user.name}</div>
            <div className="text-[11px] text-ge-muted">{d.qualifications}</div>
          </div>
        </div>
      ),
    },
    { key: "spec", header: "Specialty", cell: (d) => d.specialties[0]?.specialty.nameEn ?? "—" },
    { key: "city", header: "City", cell: (d) => d.city.nameEn },
    { key: "fee", header: "Video fee", align: "right", cell: (d) => <span className="ge-mono">{formatPkr(d.consultFeePaisa)}</span> },
    { key: "rating", header: "Rating", align: "right", cell: (d) => `${d.ratingAvg.toFixed(1)}★ (${d.ratingCount})` },
    {
      key: "verif", header: "Verification", cell: (d) => (
        <Badge variant={d.verifiedStatus === "APPROVED" ? "success" : d.verifiedStatus === "PENDING" ? "warning" : "danger"}>
          {d.verifiedStatus}
        </Badge>
      ),
    },
  ];

  return (
    <AppShell navItems={ADMIN_NAV} user={{ name: me.name, role: "Super Admin", image: me.image }} title="Doctors" subtitle={`${doctors.length} on the platform`}>
      <DataTable columns={cols} rows={doctors} rowKey={(d) => d.id} caption="All doctors" />
    </AppShell>
  );
}
