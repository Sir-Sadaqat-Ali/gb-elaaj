import Link from "next/link";
import { Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_NAV } from "@/app/(admin)/admin/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/data/empty-state";
import { ROLE_LABEL } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search" };

const ci = (q: string): Prisma.StringFilter => ({ contains: q, mode: "insensitive" });

export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireRole("ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  const q = (await searchParams).q?.trim() ?? "";
  const ready = q.length >= 2;

  const [users, doctors, labs, pharmacies] = ready
    ? await Promise.all([
        prisma.user.findMany({
          where: { OR: [{ name: ci(q) }, { email: ci(q) }, { phone: ci(q) }] },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
        prisma.doctorProfile.findMany({
          where: { OR: [{ user: { name: ci(q) } }, { pmdcNumber: ci(q) }] },
          include: { user: true, specialties: { include: { specialty: true } } },
          take: 8,
        }),
        prisma.lab.findMany({ where: { OR: [{ name: ci(q) }, { license: ci(q) }] }, include: { city: true }, take: 6 }),
        prisma.pharmacy.findMany({ where: { OR: [{ name: ci(q) }, { license: ci(q) }] }, include: { city: true }, take: 6 }),
      ])
    : [[], [], [], []];

  const total = users.length + doctors.length + labs.length + pharmacies.length;

  return (
    <AppShell navItems={ADMIN_NAV} user={{ name: me.name, role: "Super Admin", image: me.image }} title="Search" subtitle="Find users, doctors, labs, and pharmacies.">
      <form method="get" className="mb-4 flex max-w-xl items-center gap-2 rounded-md border border-ge-border bg-white px-3 py-2">
        <Search className="h-4 w-4 text-ge-muted" />
        <input
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Search name, email, phone, PMDC, or license…"
          className="w-full bg-transparent text-[13px] placeholder:text-ge-muted focus:outline-none"
        />
      </form>

      {!ready ? (
        <EmptyState icon={Search} title="Type to search" body="Enter at least 2 characters to search across the platform." />
      ) : total === 0 ? (
        <EmptyState icon={Search} title="No matches" body={`Nothing found for "${q}".`} />
      ) : (
        <div className="space-y-5">
          {users.length > 0 && (
            <Group title="Users" count={users.length}>
              {users.map((u) => (
                <Link key={u.id} href={`/admin/users?q=${encodeURIComponent(u.email ?? u.name)}`} className="flex items-center gap-3 rounded-lg border border-ge-border bg-white p-3 hover:border-ge-primary">
                  <Avatar src={u.image} name={u.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ge-ink">{u.name}</div>
                    <div className="truncate text-[11px] text-ge-muted">{u.email ?? u.phone ?? "—"}</div>
                  </div>
                  <Badge variant="info">{ROLE_LABEL[u.role]}</Badge>
                </Link>
              ))}
            </Group>
          )}

          {doctors.length > 0 && (
            <Group title="Doctors" count={doctors.length}>
              {doctors.map((d) => (
                <Link key={d.id} href={`/doctor/${d.slug}`} target="_blank" className="flex items-center gap-3 rounded-lg border border-ge-border bg-white p-3 hover:border-ge-primary">
                  <Avatar src={d.user.image} name={d.user.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ge-ink">{d.user.name}</div>
                    <div className="truncate text-[11px] text-ge-muted">{d.specialties[0]?.specialty.nameEn ?? "—"} · PMDC {d.pmdcNumber}</div>
                  </div>
                  <Badge variant={d.verifiedStatus === "APPROVED" ? "success" : "warning"}>{d.verifiedStatus}</Badge>
                </Link>
              ))}
            </Group>
          )}

          {labs.length > 0 && (
            <Group title="Labs" count={labs.length}>
              {labs.map((l) => (
                <div key={l.id} className="flex items-center gap-3 rounded-lg border border-ge-border bg-white p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ge-ink">{l.name}</div>
                    <div className="truncate text-[11px] text-ge-muted">{l.city.nameEn} · License {l.license}</div>
                  </div>
                  <Badge variant={l.verified ? "success" : "warning"}>{l.verified ? "Verified" : "Pending"}</Badge>
                </div>
              ))}
            </Group>
          )}

          {pharmacies.length > 0 && (
            <Group title="Pharmacies" count={pharmacies.length}>
              {pharmacies.map((ph) => (
                <div key={ph.id} className="flex items-center gap-3 rounded-lg border border-ge-border bg-white p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ge-ink">{ph.name}</div>
                    <div className="truncate text-[11px] text-ge-muted">{ph.city.nameEn} · License {ph.license}</div>
                  </div>
                  <Badge variant={ph.verified ? "success" : "warning"}>{ph.verified ? "Verified" : "Pending"}</Badge>
                </div>
              ))}
            </Group>
          )}
        </div>
      )}
    </AppShell>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <h2 className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-ge-muted">{title} · {count}</h2>
      <div className="space-y-2">{children}</div>
    </Card>
  );
}
