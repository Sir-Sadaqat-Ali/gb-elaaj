import { Activity } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_NAV } from "@/app/(admin)/admin/_nav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/data/empty-state";
import { relativeTime, formatDateTime } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin · Audit log" };

const PAGE_SIZE = 50;

// Colour the action verb so scanning is fast: red = destructive/money-out,
// green = create/approve, neutral otherwise.
function actionTone(action: string): "danger" | "success" | "info" | "neutral" {
  if (/(cancel|reject|delete|refund|suspend|blocked|removed)/i.test(action)) return "danger";
  if (/(created|approved|completed|imported|booked|paid|verified)/i.test(action)) return "success";
  if (/(download|viewed|login)/i.test(action)) return "info";
  return "neutral";
}

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const session = await requireRole("ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, image: true } });
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const where = q ? { action: { contains: q, mode: "insensitive" as const } } : {};
  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { actor: { select: { name: true, image: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppShell
      navItems={ADMIN_NAV}
      user={{ name: me?.name ?? "Admin", role: "Super Admin", image: me?.image }}
      title="Audit log"
      subtitle={`${total.toLocaleString()} recorded events · every auth, money, PHI, and admin action`}
    >
      <form className="mb-4 flex gap-2" action="/admin/audit-log">
        <input
          name="q"
          defaultValue={q}
          placeholder="Filter by action (e.g. cancelled, download, withdrawal)…"
          className="h-10 w-full max-w-md rounded-full border border-ge-border bg-white px-4 text-sm"
        />
      </form>

      {logs.length === 0 ? (
        <EmptyState icon={Activity} title="No matching events" body="Try a different action keyword." />
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-ge-border">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar src={l.actor?.image} name={l.actor?.name ?? "System"} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={actionTone(l.action)}>{l.action}</Badge>
                    {l.targetType && (
                      <span className="text-[11.5px] text-ge-muted">
                        {l.targetType}
                        {l.targetId ? ` · ${l.targetId.slice(-8)}` : ""}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-ge-muted">
                    {l.actor?.name ?? "System"}
                    {l.actor?.role ? ` (${l.actor.role})` : ""} · {formatDateTime(l.createdAt)}
                  </div>
                </div>
                <span className="shrink-0 text-[11px] text-ge-muted">{relativeTime(l.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/admin/audit-log?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className="rounded-full border border-ge-border bg-white px-4 py-1.5 text-[12.5px] font-medium text-ge-ink hover:border-ge-primary"
            >
              ← Previous
            </a>
          )}
          <span className="text-[12px] text-ge-muted">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <a
              href={`/admin/audit-log?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className="rounded-full border border-ge-border bg-white px-4 py-1.5 text-[12.5px] font-medium text-ge-ink hover:border-ge-primary"
            >
              Next →
            </a>
          )}
        </div>
      )}
    </AppShell>
  );
}
