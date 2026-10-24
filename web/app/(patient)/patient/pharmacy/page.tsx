import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PATIENT_NAV } from "@/app/(patient)/patient/_nav";
import { PharmacyShop } from "@/components/booking/pharmacy-shop";

export const metadata = { title: "Pharmacy" };
export const dynamic = "force-dynamic";

type ShopMed = {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyCity: string;
  nameGeneric: string;
  nameBrand: string | null;
  strength: string | null;
  pricePaisa: number;
  mrpPaisa: number;
  rxRequired: boolean;
  stock: number;
};

type MedWithPharmacy = Awaited<ReturnType<typeof loadMeds>>[number];
function loadMeds() {
  return prisma.medicine.findMany({
    where: { active: true, stock: { gt: 0 } },
    include: { pharmacy: { include: { city: true } } },
    orderBy: { nameGeneric: "asc" },
    take: 36,
  });
}
const toShopMed = (m: MedWithPharmacy): ShopMed => ({
  id: m.id,
  pharmacyId: m.pharmacyId,
  pharmacyName: m.pharmacy.name,
  pharmacyCity: m.pharmacy.city.nameEn,
  nameGeneric: m.nameGeneric,
  nameBrand: m.nameBrand,
  strength: m.strength,
  pricePaisa: m.pricePaisa,
  mrpPaisa: m.mrpPaisa,
  rxRequired: m.rxRequired,
  stock: m.stock,
});

export default async function PatientPharmacyPage({
  searchParams,
}: {
  searchParams: Promise<{ reorder?: string }>;
}) {
  const session = await requireRole("PATIENT");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { patient: { include: { city: true } } },
  });
  if (!me?.patient) return null;

  const { reorder } = await searchParams;

  const [meds, recent] = await Promise.all([
    loadMeds(),
    prisma.pharmacyOrder.findMany({
      where: { patientId: me.patient.id },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  // Build the shop catalogue (dedupe by id as we may merge reorder items in).
  const shopMedById = new Map<string, ShopMed>(meds.map((m) => [m.id, toShopMed(m)]));

  let initialCart: Record<string, number> | undefined;
  let reorderNotice: string[] | undefined;

  if (reorder) {
    const order = await prisma.pharmacyOrder.findUnique({
      where: { id: reorder },
      include: { items: { include: { medicine: { include: { pharmacy: { include: { city: true } } } } } } },
    });
    if (order && order.patientId === me.patient.id) {
      const cart: Record<string, number> = {};
      const dropped: string[] = [];
      for (const it of order.items) {
        const med = it.medicine;
        const label = med.nameBrand ?? med.nameGeneric;
        if (!med.active || med.stock < 1) {
          dropped.push(label);
          continue;
        }
        // Ensure the medicine is present in the catalogue even if it fell
        // outside the default top-36 / in-stock window.
        if (!shopMedById.has(med.id)) shopMedById.set(med.id, toShopMed(med));
        cart[med.id] = Math.min(it.qty, med.stock);
      }
      if (Object.keys(cart).length > 0) initialCart = cart;
      if (dropped.length > 0) reorderNotice = dropped;
    }
  }

  return (
    <AppShell
      navItems={PATIENT_NAV}
      user={{ name: me.name, role: "Patient", image: me.image }}
      title="Pharmacy"
      subtitle="Browse, add to cart, and check out. Same-day delivery in 8 cities."
    >
      <PharmacyShop
        meds={[...shopMedById.values()]}
        defaultAddress={me.patient.addressLine ?? ""}
        defaultCity={me.patient.city?.nameEn ?? ""}
        recentOrders={recent.map((o) => ({
          id: o.id,
          status: o.status,
          totalPaisa: o.totalPaisa,
          createdAt: o.createdAt.toISOString(),
        }))}
        initialCart={initialCart}
        reorderNotice={reorderNotice}
      />
    </AppShell>
  );
}
