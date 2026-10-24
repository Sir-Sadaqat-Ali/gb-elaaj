import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PATIENT_NAV } from "@/app/(patient)/patient/_nav";
import { LabBookingForm } from "@/components/booking/lab-booking-form";

export const metadata = { title: "Lab Tests" };
export const dynamic = "force-dynamic";

export default async function PatientLabTestsPage() {
  const session = await requireRole("PATIENT");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { patient: true },
  });
  if (!me?.patient) return null;

  const tests = await prisma.labTest.findMany({
    where: { active: true },
    include: { lab: { include: { city: true } } },
    orderBy: { nameEn: "asc" },
    take: 24,
  });

  return (
    <AppShell
      navItems={PATIENT_NAV}
      user={{ name: me.name, role: "Patient", image: me.image }}
      title="Lab tests"
      subtitle="Book diagnostic tests with home sample collection."
    >
      <LabBookingForm
        defaultAddress={me.patient.addressLine ?? ""}
        tests={tests.map((t) => ({
          id: t.id,
          slug: t.slug,
          nameEn: t.nameEn,
          labName: t.lab.name,
          city: t.lab.city.nameEn,
          sampleType: t.sampleType ?? "—",
          turnaroundHrs: t.turnaroundHrs,
          fastingRequired: t.fastingRequired,
          homeEligible: t.homeEligible,
          pricePaisa: t.pricePaisa,
        }))}
      />
    </AppShell>
  );
}
