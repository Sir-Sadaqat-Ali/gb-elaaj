import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { DOCTOR_NAV } from "@/app/(doctor)/doctor/_nav";
import { Card } from "@/components/ui/card";
import { ScheduleEditor } from "@/components/booking/schedule-editor";
import { formatDate, formatTime } from "@/lib/formatting";

export const dynamic = "force-dynamic";
export const metadata = { title: "Schedule" };

export default async function DoctorSchedulePage() {
  const session = await requireRole("DOCTOR");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { doctor: true } });
  if (!me?.doctor) return null;

  const upcoming = await prisma.doctorAvailability.findMany({
    where: { doctorId: me.doctor.id, startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: 80,
  });

  const totalOpen = upcoming.filter((s) => s.status === "OPEN").length;
  const totalBooked = upcoming.filter((s) => s.status === "BOOKED").length;

  return (
    <AppShell
      navItems={DOCTOR_NAV}
      user={{ name: me.name, role: "Doctor", image: me.image }}
      title="Schedule"
      subtitle={`${totalOpen} open · ${totalBooked} booked over the next 60 days`}
    >
      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <h2 className="text-[14px] font-semibold text-ge-ink">Generate availability</h2>
          <p className="mt-1 text-[12px] text-ge-muted">
            Create open slots for a range of days. Existing slots aren&apos;t duplicated.
          </p>
          <div className="mt-4">
            <ScheduleEditor />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-[14px] font-semibold text-ge-ink">Upcoming slots</h2>
          <p className="mt-1 text-[12px] text-ge-muted">First 80 slots starting from now.</p>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-ge-muted">No future slots. Use the editor to generate availability.</p>
          ) : (
            <ul className="mt-3 max-h-[420px] overflow-auto divide-y divide-ge-border text-[12.5px]">
              {upcoming.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <span>
                    <strong>{formatDate(s.startsAt)}</strong> · {formatTime(s.startsAt)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${
                      s.status === "OPEN" ? "bg-[color:var(--ge-success-bg)] text-[color:var(--ge-success)]"
                      : s.status === "BOOKED" ? "bg-[color:rgba(11,132,254,.10)] text-ge-primary"
                      : "bg-ge-soft-bg text-ge-muted"
                    }`}
                  >
                    {s.mode === "VIDEO" ? "Video" : "Clinic"} · {s.status.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
