import Link from "next/link";
import { Activity, AlertTriangle, Beaker, FileText, Heart, Pill, Sparkles, Stethoscope } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PATIENT_NAV } from "@/app/(patient)/patient/_nav";
import { Card } from "@/components/ui/card";
import { Kpi } from "@/components/data/kpi";
import { Badge } from "@/components/ui/badge";
import { AIDisclaimer } from "@/components/ai/ai-disclaimer";
import { Button } from "@/components/ui/button";
import { formatDate, relativeTime } from "@/lib/formatting";

type LabParam = { name: string; value: string; unit?: string; range?: string; flag?: string };
type RxLine = { drug: string; strength?: string; frequency?: string; durationDays?: number };

export const metadata = { title: "Health insights" };
export const dynamic = "force-dynamic";

export default async function PatientHealthInsightsPage() {
  const session = await requireRole("PATIENT");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { patient: true },
  });
  if (!me?.patient) return null;

  const [records, abnormalLabBookings, completedAppointments, openOrders] = await Promise.all([
    prisma.medicalRecord.findMany({
      where: { patientId: me.patient.id },
      orderBy: { recordedAt: "desc" },
      take: 50,
    }),
    prisma.labBooking.findMany({
      where: { patientId: me.patient.id, report: { abnormal: true } },
      include: { test: true, lab: true, report: true },
      orderBy: { scheduledFor: "desc" },
      take: 5,
    }),
    prisma.appointment.count({ where: { patientId: me.patient.id, status: "COMPLETED" } }),
    prisma.pharmacyOrder.count({
      where: {
        patientId: me.patient.id,
        status: { notIn: ["DELIVERED", "CANCELLED", "REFUNDED"] },
      },
    }),
  ]);

  const rxRecords = records.filter((r) => r.type === "PRESCRIPTION");
  const labRecords = records.filter((r) => r.type === "LAB_REPORT");
  const vitalRecords = records.filter((r) => r.type === "VITAL");
  const conditionRecords = records.filter((r) => r.type === "CONDITION");
  const allergyRecords = records.filter((r) => r.type === "ALLERGY");

  // Active medications: aggregate latest 3 Rx lines
  const activeMeds = rxRecords
    .slice(0, 3)
    .flatMap((r) => {
      const lines = (r.data as { lines?: RxLine[] } | null)?.lines ?? [];
      return lines.map((l) => ({ ...l, recordedAt: r.recordedAt }));
    })
    .slice(0, 6);

  // Latest lab parameters (from the most recent reported booking)
  const latestLab = abnormalLabBookings[0] ?? null;
  const latestParams: LabParam[] = latestLab
    ? ((latestLab.report?.results as { parameters?: LabParam[] } | null)?.parameters ?? [])
    : [];

  return (
    <AppShell
      navItems={PATIENT_NAV}
      user={{ name: me.name, role: "Patient", image: me.image }}
      title="Health insights"
      subtitle="A summary of your records, medications, and lab trends."
    >
      <div className="grid gap-3 md:grid-cols-4">
        <Kpi label="Past consultations" value={String(completedAppointments)} icon={Stethoscope} />
        <Kpi label="Lab reports" value={String(labRecords.length)} icon={Beaker} />
        <Kpi label="Active prescriptions" value={String(rxRecords.length)} icon={Pill} />
        <Kpi label="Open orders" value={String(openOrders)} icon={FileText} />
      </div>

      {abnormalLabBookings.length > 0 && (
        <Card className="mt-4 border-[color:var(--ge-warning-border)] bg-[color:var(--ge-warning-bg)] p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-[color:var(--ge-warning)]">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold text-[color:var(--ge-warning)]">
                Abnormal lab result{abnormalLabBookings.length === 1 ? "" : "s"} flagged
              </h3>
              <ul className="mt-2 space-y-1 text-[12.5px] text-ge-ink">
                {abnormalLabBookings.map((b) => (
                  <li key={b.id}>
                    <strong>{b.test.nameEn}</strong> at {b.lab.name}{" "}
                    <span className="text-ge-muted">· {formatDate(b.scheduledFor)}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="sm" className="mt-3" variant="secondary">
                <Link href="/patient/lab-reports">Review reports</Link>
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <h2 className="text-[14px] font-semibold text-ge-ink">Active medications</h2>
          {activeMeds.length === 0 ? (
            <p className="mt-2 text-[12.5px] text-ge-muted">
              No active prescriptions. After a consultation, your doctor's Rx appears here.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-ge-border">
              {activeMeds.map((m, i) => (
                <li key={i} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ge-soft-bg text-ge-primary">
                    <Pill className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex-1">
                    <div className="text-[12.5px] font-semibold text-ge-ink">
                      {m.drug}
                      {m.strength ? <span className="ml-1 text-ge-muted">{m.strength}</span> : null}
                    </div>
                    <div className="text-[10.5px] text-ge-muted">
                      {m.frequency ?? "—"}{m.durationDays ? ` · ${m.durationDays}d` : ""}
                    </div>
                  </div>
                  <span className="text-[10.5px] text-ge-muted">{relativeTime(m.recordedAt)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-ge-ink">Latest lab snapshot</h3>
            {latestLab && (
              <Link href="/patient/lab-reports" className="text-[12px] font-medium text-ge-primary hover:underline">
                View all
              </Link>
            )}
          </div>
          {!latestLab ? (
            <p className="mt-2 text-[12.5px] text-ge-muted">
              No lab reports yet. Book a test from{" "}
              <Link href="/patient/lab-tests" className="text-ge-primary hover:underline">/patient/lab-tests</Link>.
            </p>
          ) : (
            <>
              <p className="mt-1 text-[11.5px] text-ge-muted">
                {latestLab.test.nameEn} · {latestLab.lab.name} · {formatDate(latestLab.scheduledFor)}
              </p>
              <ul className="mt-3 divide-y divide-ge-border text-[12.5px]">
                {latestParams.slice(0, 6).map((p, i) => (
                  <li key={i} className="flex items-center justify-between py-2">
                    <span className="text-ge-ink">{p.name}</span>
                    <span className="ge-mono">
                      {p.value}{p.unit ? ` ${p.unit}` : ""}
                      {p.range ? <span className="ml-1 text-ge-muted">({p.range})</span> : null}
                      {p.flag && p.flag !== "normal" && (
                        <Badge variant="warning" className="ml-2">{p.flag}</Badge>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-[13.5px] font-semibold text-ge-ink">Conditions</h3>
            {conditionRecords.length === 0 ? (
              <p className="mt-2 text-[12px] text-ge-muted">None on file.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-[12.5px] text-ge-ink">
                {conditionRecords.slice(0, 4).map((c) => (
                  <li key={c.id} className="flex items-center gap-1.5">
                    <Heart className="h-3 w-3 text-ge-primary" /> {c.title}
                  </li>
                ))}
              </ul>
            )}
            <h3 className="mt-4 text-[13.5px] font-semibold text-ge-ink">Allergies</h3>
            {allergyRecords.length === 0 ? (
              <p className="mt-2 text-[12px] text-ge-muted">None on file.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-[12.5px] text-ge-ink">
                {allergyRecords.slice(0, 4).map((c) => (
                  <li key={c.id} className="flex items-center gap-1.5">
                    <Activity className="h-3 w-3 text-[color:var(--ge-warning)]" /> {c.title}
                  </li>
                ))}
              </ul>
            )}
            <h3 className="mt-4 text-[13.5px] font-semibold text-ge-ink">Vitals on file</h3>
            <p className="mt-1 text-[11.5px] text-ge-muted">
              {vitalRecords.length === 0
                ? "No vitals recorded yet."
                : `${vitalRecords.length} reading${vitalRecords.length === 1 ? "" : "s"} captured.`}
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-ge-primary" />
              <h3 className="text-[13.5px] font-semibold text-ge-ink">Want a deeper look?</h3>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ge-muted">
              Aafiyat AI can explain a lab report or compare your latest reading to your previous one.
            </p>
            <Button asChild size="sm" variant="secondary" className="mt-3">
              <Link href="/patient/ai-assistant">Ask Aafiyat</Link>
            </Button>
            <AIDisclaimer className="mt-3" />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
