import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PATIENT_NAV } from "@/app/(patient)/patient/_nav";
import { HomeCareRequestForm } from "@/components/booking/home-care-form";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { ConfirmButton } from "@/components/data/confirm-button";
import { cancelHomeCareAction } from "@/lib/actions/home-care";
import { formatDateTime, formatPkr } from "@/lib/formatting";
import { HomeCareStatus } from "@prisma/client";

const CANCELLABLE = new Set<HomeCareStatus>([HomeCareStatus.REQUESTED, HomeCareStatus.ASSIGNED]);

const ACTIVE_STATUSES = new Set<HomeCareStatus>([
  HomeCareStatus.ASSIGNED,
  HomeCareStatus.EN_ROUTE,
  HomeCareStatus.IN_VISIT,
]);

export const metadata = { title: "Home Care" };
export const dynamic = "force-dynamic";

export default async function PatientHomeCarePage({
  searchParams,
}: {
  searchParams: Promise<{ requested?: string }>;
}) {
  const session = await requireRole("PATIENT");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { patient: true } });
  if (!me?.patient) return null;
  const { requested } = await searchParams;

  const requests = await prisma.homeCareRequest.findMany({
    where: { patientId: me.patient.id },
    include: { nurse: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell
      navItems={PATIENT_NAV}
      user={{ name: me.name, role: "Patient", image: me.image }}
      title="Home care"
      subtitle="Verified nurses for at-home services."
    >
      {requested === "1" && (
        <div className="mb-4 rounded-md border border-[color:var(--ge-success-border)] bg-[color:var(--ge-success-bg)] p-3 text-[13px] text-[color:var(--ge-success)]">
          Request submitted — admin will assign a nurse shortly.
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <h2 className="text-[14px] font-semibold text-ge-ink">Request a visit</h2>
          <p className="mt-1 text-[12px] text-ge-muted">Pick a service, when you need it, and where.</p>
          <div className="mt-4">
            <HomeCareRequestForm defaultAddress={me.patient.addressLine ?? ""} />
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-[13.5px] font-semibold text-ge-ink">Your requests</h3>
          {requests.length === 0 ? (
            <p className="mt-2 text-[12px] text-ge-muted">No home-care requests yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-ge-border">
              {requests.map((r) => (
                <li key={r.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-ge-ink">{r.serviceName}</span>
                    <StatusChip status={r.status as StatusKind} />
                  </div>
                  <div className="mt-0.5 text-[11px] text-ge-muted">
                    {formatDateTime(r.scheduledFor)} · {formatPkr(r.pricePaisa)}
                  </div>
                  {r.nurse && (
                    <div className="mt-2 flex items-center gap-2">
                      <Avatar src={r.nurse.user.image} name={r.nurse.user.name} size={24} />
                      <span className="text-[11.5px]">{r.nurse.user.name}</span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    {ACTIVE_STATUSES.has(r.status) && r.nurse && (
                      <Link
                        href={`/patient/home-care/${r.id}/track`}
                        className="inline-block text-[11.5px] font-semibold text-ge-primary hover:underline"
                      >
                        Track nurse →
                      </Link>
                    )}
                    {CANCELLABLE.has(r.status) && (
                      <ConfirmButton
                        action={cancelHomeCareAction}
                        arg={{ requestId: r.id }}
                        label="Cancel"
                        variant="destructive-outline"
                        confirmText="Cancel request?"
                        successMsg="Home-care request cancelled."
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
