import Link from "next/link";
import { ArrowRight, Beaker, Calendar, FileText, Heart, Pill, Stethoscope, Video } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PATIENT_NAV } from "@/app/(patient)/patient/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Kpi } from "@/components/data/kpi";
import { StatusChip, type StatusKind } from "@/components/ui/status-chip";
import { AIDisclaimer } from "@/components/ai/ai-disclaimer";
import { formatPkr, formatDate, formatTime } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Patient · Dashboard" };

export default async function PatientDashboardPage() {
  const session = await requireRole("PATIENT");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { patient: true },
  });
  if (!user?.patient) return null;

  const [upcoming, past, openOrder, recentLabs, recommendedDoctors] = await Promise.all([
    prisma.appointment.findFirst({
      where: { patientId: user.patient.id, status: { in: ["CONFIRMED", "PENDING"] }, scheduledFor: { gte: new Date() } },
      include: { doctor: { include: { user: true, specialties: { include: { specialty: true } }, city: true } } },
      orderBy: { scheduledFor: "asc" },
    }),
    prisma.appointment.count({ where: { patientId: user.patient.id, status: "COMPLETED" } }),
    prisma.pharmacyOrder.findFirst({
      where: { patientId: user.patient.id, status: { notIn: ["DELIVERED", "CANCELLED", "REFUNDED"] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.labBooking.findMany({
      where: { patientId: user.patient.id },
      include: { lab: true, test: true, report: true },
      orderBy: { scheduledFor: "desc" },
      take: 4,
    }),
    prisma.doctorProfile.findMany({
      where: { active: true, verifiedStatus: "APPROVED" },
      include: { user: true, specialties: { include: { specialty: true } } },
      orderBy: { ratingAvg: "desc" },
      take: 3,
    }),
  ]);

  return (
    <AppShell
      navItems={PATIENT_NAV}
      user={{ name: user.name, role: "Patient", image: user.image }}
      title={`Asalam o Alaikum, ${user.name.split(" ")[0]}`}
      subtitle={`${formatDate(new Date(), { weekday: "long", month: "long", day: "numeric" })} — Here&apos;s your health snapshot.`}
      search="Search doctors, labs, medicines…"
      actions={
        <Button asChild>
          <Link href="/doctors">
            <Stethoscope className="h-4 w-4" /> Book consultation
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <UpcomingAppointmentCard upcoming={upcoming} />
        <Card className="p-5">
          <div className="text-[12px] font-medium text-ge-muted">AI assistant</div>
          <p className="mt-2 text-[13px] leading-relaxed text-ge-ink">
            Aafiyat can help you understand reports, schedule follow-ups, and find the right specialist.
          </p>
          <Button asChild size="sm" variant="secondary" className="mt-3">
            <Link href="/patient/ai-assistant">Ask Aafiyat <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
          <AIDisclaimer className="mt-3" />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <Kpi label="Upcoming" value={upcoming ? "1" : "0"} icon={Calendar} />
        <Kpi label="Past consults" value={String(past)} icon={Stethoscope} />
        <Kpi label="Lab reports" value={String(recentLabs.filter((b) => b.report).length)} icon={Beaker} />
        <Kpi label="Order in flight" value={openOrder ? "1" : "0"} icon={Pill} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-ge-ink">Recent lab activity</h2>
            <Button asChild variant="link" size="sm"><Link href="/patient/lab-reports">View all</Link></Button>
          </div>
          {recentLabs.length === 0 ? (
            <p className="text-sm text-ge-muted">No lab bookings yet.</p>
          ) : (
            <ul className="divide-y divide-ge-border">
              {recentLabs.map((b) => (
                <li key={b.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ge-soft-bg text-ge-primary">
                    <Beaker className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ge-ink">{b.test.nameEn}</div>
                    <div className="text-[11px] text-ge-muted">{b.lab.name} · {formatDate(b.scheduledFor)}</div>
                  </div>
                  <StatusChip status={b.status as StatusKind} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-ge-ink">Quick actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/doctors", icon: Stethoscope, label: "Find doctor" },
                { href: "/patient/lab-tests", icon: Beaker, label: "Order lab" },
                { href: "/patient/pharmacy", icon: Pill, label: "Refill meds" },
                { href: "/patient/home-care", icon: Heart, label: "Home nurse" },
              ].map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex items-center gap-2 rounded-md border border-ge-border bg-white px-3 py-2 text-[12.5px] font-medium text-ge-ink transition hover:border-ge-primary"
                >
                  <a.icon className="h-3.5 w-3.5 text-ge-primary" /> {a.label}
                </Link>
              ))}
            </div>
          </Card>

          {openOrder && (
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ge-soft-bg text-ge-primary">
                  <Pill className="h-3.5 w-3.5" />
                </span>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-ge-ink">Order #{openOrder.id.slice(-6).toUpperCase()}</div>
                  <div className="text-[11px] text-ge-muted">{formatPkr(openOrder.totalPaisa)}</div>
                </div>
                <StatusChip status={openOrder.status as StatusKind} />
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-ge-ink">Recommended for you</h2>
            <Button asChild variant="link" size="sm"><Link href="/doctors">View all</Link></Button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {recommendedDoctors.map((d) => (
              <Link
                key={d.id}
                href={`/doctor/${d.slug}`}
                className="flex items-center gap-3 rounded-lg border border-ge-border bg-white p-3 transition hover:border-ge-primary/40"
              >
                <Avatar src={d.user.image} name={d.user.name} size={44} />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-ge-ink">{d.user.name}</div>
                  <div className="text-[11px] text-ge-muted">{d.specialties[0]?.specialty.nameEn}</div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function UpcomingAppointmentCard({
  upcoming,
}: {
  upcoming: Awaited<ReturnType<typeof prisma.appointment.findFirst>> & {
    doctor?: {
      user: { name: string; image: string | null };
      specialties: { specialty: { nameEn: string } }[];
    };
  } | null;
}) {
  if (!upcoming || !upcoming.doctor) {
    return (
      <Card className="md:col-span-2 p-5">
        <div className="flex items-center gap-2 text-[12px] text-ge-muted">
          <Calendar className="h-3.5 w-3.5" /> No upcoming appointments
        </div>
        <h2 className="mt-2 text-[15px] font-semibold text-ge-ink">Find a verified doctor and book in 60 seconds.</h2>
        <Button asChild className="mt-3" size="sm"><Link href="/doctors">Find a doctor <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
      </Card>
    );
  }
  return (
    <Card
      className="md:col-span-2 overflow-hidden border-ge-navy bg-ge-navy p-5 text-white"
      style={{ backgroundImage: "radial-gradient(60% 100% at 100% 0%, rgba(11,132,254,.4) 0%, transparent 60%)" }}
    >
      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-ge-primary-3">
        Upcoming · {formatTime(upcoming.scheduledFor)}
      </span>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Avatar src={upcoming.doctor.user.image} name={upcoming.doctor.user.name} size={56} className="bg-white/15" />
        <div className="flex-1">
          <div className="text-[16px] font-semibold">{upcoming.doctor.user.name}</div>
          <div className="text-[12px] text-white/75">
            {upcoming.doctor.specialties[0]?.specialty.nameEn} · {formatDate(upcoming.scheduledFor)} · {upcoming.mode === "VIDEO" ? "Video" : "Clinic"} consultation
          </div>
        </div>
        <Button asChild className="bg-white text-ge-primary hover:bg-white/90">
          <Link href={`/patient/appointments/${upcoming.id}`}>
            <Video className="h-4 w-4" /> Join
          </Link>
        </Button>
      </div>
    </Card>
  );
}
