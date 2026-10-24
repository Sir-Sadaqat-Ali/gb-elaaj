import Link from "next/link";
import { AlertTriangle, Beaker, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { DOCTOR_NAV } from "@/app/(doctor)/doctor/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/data/empty-state";
import { formatDate, formatPkr } from "@/lib/formatting";

type LabParam = { name: string; value: string; unit?: string; range?: string; flag?: string };

export const metadata = { title: "Lab reports" };
export const dynamic = "force-dynamic";

export default async function DoctorLabReportsPage() {
  const session = await requireRole("DOCTOR");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { doctor: true },
  });
  if (!me?.doctor) return null;

  // Doctor sees lab reports of patients they've seen.
  const patientIds = await prisma.appointment.findMany({
    where: { doctorId: me.doctor.id },
    select: { patientId: true },
    distinct: ["patientId"],
  });
  const ids = patientIds.map((p) => p.patientId);

  const reports = ids.length
    ? await prisma.labBooking.findMany({
        where: { patientId: { in: ids }, status: "REPORTED" },
        include: {
          patient: { include: { user: true } },
          test: true,
          lab: true,
          report: true,
        },
        orderBy: { scheduledFor: "desc" },
        take: 50,
      })
    : [];

  return (
    <AppShell
      navItems={DOCTOR_NAV}
      user={{ name: me.name, role: "Doctor", image: me.image }}
      title="Lab reports"
      subtitle={`${reports.length} report${reports.length === 1 ? "" : "s"} from your patients`}
    >
      {reports.length === 0 ? (
        <EmptyState
          icon={Beaker}
          title="No lab reports yet"
          body="Reports appear here when your patients receive a lab result."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {reports.map((b) => {
            const r = b.report;
            const params = ((r?.results as { parameters?: LabParam[] } | null)?.parameters) ?? [];
            const summary = ((r?.results as { summary?: string } | null)?.summary) ?? "";
            return (
              <Card key={b.id} className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ge-soft-bg text-ge-primary">
                    <Beaker className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-ge-ink">{b.test.nameEn}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <Avatar src={b.patient.user.image} name={b.patient.user.name} size={20} />
                      <span className="text-[12px] text-ge-muted">{b.patient.user.name}</span>
                      <span className="text-[10.5px] text-ge-muted">· {formatDate(b.scheduledFor)}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-ge-muted">{b.lab.name}</div>
                  </div>
                  {r?.abnormal && (
                    <Badge variant="warning" className="gap-1">
                      <AlertTriangle className="h-3 w-3" /> Abnormal
                    </Badge>
                  )}
                </div>
                {summary && <p className="mt-3 text-[12.5px] leading-relaxed text-ge-ink">{summary}</p>}
                {params.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-ge-border pt-3 text-[11.5px]">
                    {params.slice(0, 4).map((p, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span className="text-ge-muted">{p.name}</span>
                        <span className="ge-mono">
                          {p.value}{p.unit ? ` ${p.unit}` : ""}
                          {p.range ? <span className="ml-1 text-ge-muted">({p.range})</span> : null}
                          {p.flag && p.flag !== "normal" && (
                            <span className="ml-1.5 text-[color:var(--ge-warning)]">{p.flag}</span>
                          )}
                        </span>
                      </li>
                    ))}
                    {params.length > 4 && (
                      <li className="text-[11px] text-ge-muted">+ {params.length - 4} more</li>
                    )}
                  </ul>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-ge-muted">
                    <span className="ge-mono">#{b.id.slice(-6).toUpperCase()}</span> · {formatPkr(b.pricePaisa)}
                  </span>
                  {r?.fileKey && (
                    <Link
                      href={`/api/files/${r.id}/download?kind=lab-report`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1 text-[11.5px] font-medium text-ge-primary hover:underline"
                    >
                      Open file <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
