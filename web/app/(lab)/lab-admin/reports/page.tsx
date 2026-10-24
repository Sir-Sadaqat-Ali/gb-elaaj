import Link from "next/link";
import { AlertTriangle, Beaker, ExternalLink, Upload } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { LAB_NAV } from "@/app/(lab)/lab-admin/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/data/empty-state";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { formatDate, formatPkr } from "@/lib/formatting";

type LabParam = { name: string; value: string; unit?: string; range?: string; flag?: string };

export const metadata = { title: "Lab reports" };
export const dynamic = "force-dynamic";

export default async function LabReportsAdminPage() {
  const session = await requireRole("LAB_ADMIN");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { labAdmin: true },
  });
  if (!me?.labAdmin) return null;

  // Two buckets: bookings awaiting upload, and reports already uploaded.
  const [pending, uploaded] = await Promise.all([
    prisma.labBooking.findMany({
      where: { labId: me.labAdmin.id, status: { in: ["BOOKED", "COLLECTED", "PROCESSING"] } },
      include: { patient: { include: { user: true } }, test: true },
      orderBy: { scheduledFor: "asc" },
      take: 30,
    }),
    prisma.labBooking.findMany({
      where: { labId: me.labAdmin.id, status: "REPORTED" },
      include: { patient: { include: { user: true } }, test: true, report: true },
      orderBy: { scheduledFor: "desc" },
      take: 30,
    }),
  ]);

  return (
    <AppShell
      navItems={LAB_NAV}
      user={{ name: me.name, role: `Lab · ${me.labAdmin.name}`, image: me.image }}
      title="Reports"
      subtitle={`${pending.length} awaiting upload · ${uploaded.length} uploaded`}
    >
      {/* Pending */}
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-ge-primary" />
          <h2 className="text-[14px] font-semibold text-ge-ink">Awaiting upload</h2>
          <Badge variant="warning" className="ml-1">{pending.length}</Badge>
        </div>
        {pending.length === 0 ? (
          <p className="mt-3 text-[12.5px] text-ge-muted">All caught up — no reports waiting.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ge-border">
            {pending.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-3">
                <Avatar src={b.patient.user.image} name={b.patient.user.name} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-ge-ink">{b.test.nameEn}</div>
                  <div className="text-[11px] text-ge-muted">
                    {b.patient.user.name} · {formatDate(b.scheduledFor)} · {b.mode}
                  </div>
                </div>
                <StatusChip status={b.status as StatusKind} />
                <Button asChild size="sm">
                  <Link href={`/lab-admin/bookings/${b.id}`}>
                    <Upload className="h-3.5 w-3.5" /> Open
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Uploaded */}
      <Card className="mt-4 p-5">
        <div className="flex items-center gap-2">
          <Beaker className="h-4 w-4 text-ge-primary" />
          <h2 className="text-[14px] font-semibold text-ge-ink">Uploaded reports</h2>
          <Badge variant="info" className="ml-1">{uploaded.length}</Badge>
        </div>
        {uploaded.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={Beaker}
              title="No uploaded reports yet"
              body="When you finish a booking and upload its result, it appears here."
            />
          </div>
        ) : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {uploaded.map((b) => {
              const params = ((b.report?.results as { parameters?: LabParam[] } | null)?.parameters) ?? [];
              return (
                <li key={b.id} className="rounded-lg border border-ge-border p-4">
                  <div className="flex items-start gap-3">
                    <Avatar src={b.patient.user.image} name={b.patient.user.name} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-ge-ink">{b.test.nameEn}</div>
                      <div className="text-[11px] text-ge-muted">
                        {b.patient.user.name} · {formatDate(b.scheduledFor)}
                      </div>
                    </div>
                    {b.report?.abnormal && (
                      <Badge variant="warning" className="gap-1">
                        <AlertTriangle className="h-3 w-3" /> Abnormal
                      </Badge>
                    )}
                  </div>
                  {params.length > 0 && (
                    <ul className="mt-3 space-y-0.5 border-t border-ge-border pt-2 text-[11.5px]">
                      {params.slice(0, 3).map((p, i) => (
                        <li key={i} className="flex items-center justify-between">
                          <span className="text-ge-muted">{p.name}</span>
                          <span className="ge-mono">
                            {p.value}{p.unit ? ` ${p.unit}` : ""}
                            {p.flag && p.flag !== "normal" && (
                              <span className="ml-1 text-[color:var(--ge-warning)]">{p.flag}</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10.5px] text-ge-muted">
                      <span className="ge-mono">#{b.id.slice(-6).toUpperCase()}</span> · {formatPkr(b.pricePaisa)}
                    </span>
                    <div className="flex items-center gap-2">
                      {b.report?.fileKey && (
                        <Link
                          href={`/api/files/${b.report.id}/download?kind=lab-report`}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-ge-primary hover:underline"
                        >
                          File <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                      <Link
                        href={`/lab-admin/bookings/${b.id}`}
                        className="text-[11px] font-medium text-ge-primary hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
