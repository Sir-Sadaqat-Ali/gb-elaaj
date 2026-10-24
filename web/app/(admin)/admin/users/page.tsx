import Link from "next/link";
import { Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_NAV } from "@/app/(admin)/admin/_nav";
import { DataTable, type Column } from "@/components/data/data-table";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { ConfirmButton } from "@/components/data/confirm-button";
import { ExportButton } from "@/components/data/export-button";
import { setUserStatusAction } from "@/lib/actions/admin";
import { ROLE_LABEL } from "@/lib/rbac";
import { formatDate } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin · Users" };

const STATUSES = ["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED"] as const;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>;
}) {
  const session = await requireRole("ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  const { q, role, status } = await searchParams;
  const roleFilter = role && role in ROLE_LABEL ? (role as keyof typeof ROLE_LABEL) : undefined;
  const statusFilter = status && (STATUSES as readonly string[]).includes(status) ? status : undefined;

  const where: Prisma.UserWhereInput = {
    ...(q?.trim()
      ? {
          OR: [
            { name: { contains: q.trim(), mode: "insensitive" } },
            { email: { contains: q.trim(), mode: "insensitive" } },
            { phone: { contains: q.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(statusFilter ? { status: statusFilter as Prisma.UserWhereInput["status"] } : {}),
  };

  const [users, total, suspendedCount] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
  ]);

  const cols: Column<(typeof users)[number]>[] = [
    {
      key: "user", header: "User", cell: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar src={u.image} name={u.name} size={32} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-ge-ink">
              {u.name}
              {u.id === me.id && <span className="rounded bg-ge-soft-bg px-1.5 py-0.5 text-[9.5px] font-semibold uppercase text-ge-muted">You</span>}
            </div>
            <div className="truncate text-[11px] text-ge-muted">{u.email ?? u.phone ?? "—"}</div>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Role", cell: (u) => <Badge variant="info">{ROLE_LABEL[u.role]}</Badge> },
    { key: "status", header: "Status", cell: (u) => <StatusChip status={u.status as StatusKind} /> },
    { key: "joined", header: "Joined", cell: (u) => <span className="text-[11.5px] text-ge-muted">{formatDate(u.createdAt)}</span> },
    {
      key: "actions", header: "", cell: (u) =>
        u.id === me.id ? (
          <span className="text-[11px] text-ge-muted">—</span>
        ) : u.status === "SUSPENDED" ? (
          <ConfirmButton
            action={setUserStatusAction}
            arg={{ userId: u.id, status: "ACTIVE" as const }}
            label="Reactivate"
            variant="secondary"
            successMsg="User reactivated."
            className="h-7 px-2.5 text-[11px]"
          />
        ) : (
          <ConfirmButton
            action={setUserStatusAction}
            arg={{ userId: u.id, status: "SUSPENDED" as const }}
            label="Suspend"
            variant="destructive-outline"
            confirmText="Suspend & block login?"
            successMsg="User suspended."
            className="h-7 px-2.5 text-[11px]"
          />
        ),
    },
  ];

  return (
    <AppShell
      navItems={ADMIN_NAV}
      user={{ name: me.name, role: "Super Admin", image: me.image }}
      title="Users"
      subtitle={`${total} match · ${suspendedCount} suspended`}
      actions={<ExportButton type="users" />}
    >
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border border-ge-border bg-white px-3 py-2">
          <Search className="h-3.5 w-3.5 text-ge-muted" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search name, email, or phone"
            className="w-full bg-transparent text-[12.5px] placeholder:text-ge-muted focus:outline-none"
          />
        </label>
        <select name="role" defaultValue={roleFilter ?? ""} className="h-10 rounded-md border border-ge-border bg-white px-3 text-[12.5px]">
          <option value="">All roles</option>
          {Object.entries(ROLE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select name="status" defaultValue={statusFilter ?? ""} className="h-10 rounded-md border border-ge-border bg-white px-3 text-[12.5px]">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}</option>
          ))}
        </select>
        <Button type="submit" variant="secondary">Filter</Button>
        {(q || roleFilter || statusFilter) && (
          <Link href="/admin/users" className="text-[12px] font-medium text-ge-primary hover:underline">Clear</Link>
        )}
      </form>

      <DataTable columns={cols} rows={users} rowKey={(u) => u.id} caption="All users" />
    </AppShell>
  );
}
