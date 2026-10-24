// ─────────────────────────────────────────────────────────────
// Gb Elaaj — Production-safe demo user provisioning.
//
// Creates one demo account per role (PATIENT, DOCTOR, PHARMACY_ADMIN,
// LAB_ADMIN, NURSE, FINANCE) plus their related profile records, so
// every dashboard can be exercised on a non-empty production DB.
//
// SAFETY:
//   - Idempotent: every record is upsert; re-running is a no-op for
//     existing accounts.
//   - Refuses to run unless ENABLE_PRODUCTION_DEMO_USERS=true is set
//     explicitly. Adding it to Vercel by accident is the only hazard.
//   - Never deletes data. Never overwrites existing user passwords.
//   - Generated passwords are random per-run; printed once at the end.
//
// Run:
//   ENABLE_PRODUCTION_DEMO_USERS=true \
//   DATABASE_URL=$NEON_POOLED \
//   DIRECT_URL=$NEON_DIRECT \
//   pnpm db:demo-users
//
// See PRODUCTION_BOOTSTRAP_PLAN.md.
// ─────────────────────────────────────────────────────────────

import {
  PrismaClient,
  Role,
  Gender,
  ConsultMode,
  SlotStatus,
  DoctorVerificationStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();
const BCRYPT_COST = 12;

function generatePassword(): string {
  return randomBytes(16).toString("base64url").slice(0, 16);
}

type CreatedSummary = {
  email: string;
  role: Role;
  password: string | "EXISTING";
};

async function main() {
  if (process.env.ENABLE_PRODUCTION_DEMO_USERS !== "true") {
    console.error("✋ ENABLE_PRODUCTION_DEMO_USERS is not set to 'true'.");
    console.error("   Refusing to provision demo accounts. Set the env var explicitly to proceed.");
    process.exit(1);
  }

  console.log("⚙️  Provisioning demo users…");
  const summary: CreatedSummary[] = [];

  // Reference data must already exist (run pnpm db:bootstrap first).
  const cities = await prisma.city.findMany();
  const specialties = await prisma.specialty.findMany();
  if (cities.length === 0 || specialties.length === 0) {
    console.error("✋ Reference data missing. Run pnpm db:bootstrap first.");
    process.exit(1);
  }
  const cityBy = (slug: string) => cities.find((c) => c.slug === slug);
  const specBy = (slug: string) => specialties.find((s) => s.slug === slug);

  const gilgit = cityBy("gilgit");
  const islamabad = cityBy("islamabad");
  const karachi = cityBy("karachi");
  const lahore = cityBy("lahore");
  const cardiology = specBy("cardiology");
  if (!gilgit || !islamabad || !karachi || !lahore || !cardiology) {
    console.error("✋ Required reference rows not found. Re-run pnpm db:bootstrap.");
    process.exit(1);
  }

  // ── Helper: upsert user with password set ONLY on create ────────
  async function ensureUser(opts: {
    email: string;
    name: string;
    role: Role;
    phone?: string;
  }): Promise<{ user: { id: string; email: string }; created: boolean; password?: string }> {
    const existing = await prisma.user.findUnique({ where: { email: opts.email } });
    if (existing) {
      return { user: { id: existing.id, email: existing.email ?? opts.email }, created: false };
    }
    const password = generatePassword();
    const user = await prisma.user.create({
      data: {
        email: opts.email,
        name: opts.name,
        phone: opts.phone,
        passwordHash: await bcrypt.hash(password, BCRYPT_COST),
        role: opts.role,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "user.demo.created",
        targetType: "User",
        targetId: user.id,
        meta: { role: opts.role, source: "demo-users" },
      },
    });
    return { user: { id: user.id, email: user.email ?? opts.email }, created: true, password };
  }

  // ── Patient ─────────────────────────────────────────────────────
  {
    const { user, created, password } = await ensureUser({
      email: "demo-patient@gbelaaj.pk",
      name: "Demo Patient",
      role: Role.PATIENT,
      phone: "03001234567",
    });
    await prisma.patientProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        gender: Gender.MALE,
        dob: new Date("1990-01-01"),
        bloodType: "O+",
        cityId: gilgit.id,
        addressLine: "Demo address, Gilgit",
      },
      update: {},
    });
    summary.push({ email: user.email, role: Role.PATIENT, password: created ? password! : "EXISTING" });
    console.log(`  ${created ? "✓ created" : "· existed "} ${user.email}`);
  }

  // ── Doctor + DoctorProfile + DoctorSpecialty + 30 slots ─────────
  {
    const { user, created, password } = await ensureUser({
      email: "demo-doctor@gbelaaj.pk",
      name: "Dr. Demo Doctor",
      role: Role.DOCTOR,
    });
    const profile = await prisma.doctorProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        slug: "demo-dr-doctor",
        pmdcNumber: "DEMO-PMC-12345",
        qualifications: "MBBS, FCPS (Cardiology)",
        bioEn: "Demo cardiologist for QA testing.",
        experienceYears: 14,
        consultFeePaisa: 250000,
        clinicFeePaisa: 0,
        cityId: islamabad.id,
        clinic: "Demo Clinic, Islamabad",
        languages: ["English", "Urdu"],
        verifiedStatus: DoctorVerificationStatus.APPROVED,
        verifiedAt: new Date(),
        modes: [ConsultMode.VIDEO, ConsultMode.CLINIC],
        active: true,
      },
      update: {
        active: true,
        verifiedStatus: DoctorVerificationStatus.APPROVED,
      },
    });

    await prisma.doctorSpecialty.upsert({
      where: { doctorId_specialtyId: { doctorId: profile.id, specialtyId: cardiology.id } },
      create: { doctorId: profile.id, specialtyId: cardiology.id },
      update: {},
    });

    // 30 future slots: next 5 weekdays × 6 slots × 20 min, alternating modes.
    const baseDay = new Date();
    baseDay.setHours(9, 0, 0, 0);
    let slotsCreated = 0;
    for (let d = 1; d <= 5; d++) {
      const day = new Date(baseDay);
      day.setDate(baseDay.getDate() + d);
      for (let s = 0; s < 6; s++) {
        const startsAt = new Date(day);
        startsAt.setHours(9 + s, 0, 0, 0);
        const endsAt = new Date(startsAt);
        endsAt.setMinutes(20);
        const mode = s % 2 === 0 ? ConsultMode.VIDEO : ConsultMode.CLINIC;
        try {
          await prisma.doctorAvailability.upsert({
            where: { doctorId_startsAt_mode: { doctorId: profile.id, startsAt, mode } },
            create: { doctorId: profile.id, startsAt, endsAt, mode, status: SlotStatus.OPEN },
            update: {},
          });
          slotsCreated++;
        } catch {}
      }
    }
    console.log(`  · upsert ${slotsCreated} availability slots for demo doctor`);
    summary.push({ email: user.email, role: Role.DOCTOR, password: created ? password! : "EXISTING" });
  }

  // ── Pharmacy admin + Pharmacy + 10 medicines ────────────────────
  {
    const { user, created, password } = await ensureUser({
      email: "demo-pharmacy@gbelaaj.pk",
      name: "Demo Pharmacy Admin",
      role: Role.PHARMACY_ADMIN,
    });
    const pharmacy = await prisma.pharmacy.upsert({
      where: { ownerUserId: user.id },
      create: {
        ownerUserId: user.id,
        name: "Demo Pharmacy",
        slug: "demo-pharmacy",
        cityId: karachi.id,
        license: "DEMO-PHARM-001",
        verified: true,
        active: true,
      },
      update: {},
    });
    const meds = [
      { sku: "DEMO-PARA-500", nameGeneric: "Paracetamol", nameBrand: "Panadol", form: "tablet", strength: "500mg", manufacturer: "GSK", pricePaisa: 12000, mrpPaisa: 15000, stock: 500, reorderLevel: 50, rxRequired: false },
      { sku: "DEMO-AMOX-500", nameGeneric: "Amoxicillin", nameBrand: "Amoxil", form: "capsule", strength: "500mg", manufacturer: "GSK", pricePaisa: 28000, mrpPaisa: 32000, stock: 200, reorderLevel: 30, rxRequired: true },
      { sku: "DEMO-ORS-WHO", nameGeneric: "ORS", nameBrand: "ORS Pak", form: "sachet", strength: "20.5g", manufacturer: "Hilton", pricePaisa: 5000, mrpPaisa: 6000, stock: 1000, reorderLevel: 100, rxRequired: false },
      { sku: "DEMO-METF-500", nameGeneric: "Metformin", nameBrand: "Glucophage", form: "tablet", strength: "500mg", manufacturer: "Merck", pricePaisa: 18000, mrpPaisa: 22000, stock: 300, reorderLevel: 40, rxRequired: true },
      { sku: "DEMO-AMLO-5", nameGeneric: "Amlodipine", nameBrand: "Norvasc", form: "tablet", strength: "5mg", manufacturer: "Pfizer", pricePaisa: 22000, mrpPaisa: 26000, stock: 250, reorderLevel: 30, rxRequired: true },
      { sku: "DEMO-LORA-10", nameGeneric: "Loratadine", nameBrand: "Claritin", form: "tablet", strength: "10mg", manufacturer: "Bayer", pricePaisa: 15000, mrpPaisa: 18000, stock: 200, reorderLevel: 30, rxRequired: false },
      { sku: "DEMO-OMEP-20", nameGeneric: "Omeprazole", nameBrand: "Risek", form: "capsule", strength: "20mg", manufacturer: "Getz", pricePaisa: 25000, mrpPaisa: 30000, stock: 200, reorderLevel: 30, rxRequired: true },
      { sku: "DEMO-VITC-1G", nameGeneric: "Vitamin C", nameBrand: "Cecon", form: "tablet", strength: "1000mg", manufacturer: "Abbott", pricePaisa: 30000, mrpPaisa: 35000, stock: 400, reorderLevel: 40, rxRequired: false },
      { sku: "DEMO-IBUP-400", nameGeneric: "Ibuprofen", nameBrand: "Brufen", form: "tablet", strength: "400mg", manufacturer: "Abbott", pricePaisa: 14000, mrpPaisa: 17000, stock: 350, reorderLevel: 40, rxRequired: false },
      { sku: "DEMO-ATOR-20", nameGeneric: "Atorvastatin", nameBrand: "Lipitor", form: "tablet", strength: "20mg", manufacturer: "Pfizer", pricePaisa: 35000, mrpPaisa: 40000, stock: 200, reorderLevel: 30, rxRequired: true },
    ];
    for (const m of meds) {
      await prisma.medicine.upsert({
        where: { pharmacyId_sku: { pharmacyId: pharmacy.id, sku: m.sku } },
        create: { pharmacyId: pharmacy.id, ...m },
        update: { stock: m.stock },
      });
    }
    console.log(`  · upsert ${meds.length} demo medicines`);
    summary.push({ email: user.email, role: Role.PHARMACY_ADMIN, password: created ? password! : "EXISTING" });
  }

  // ── Lab admin + Lab + 8 lab tests ──────────────────────────────
  {
    const { user, created, password } = await ensureUser({
      email: "demo-lab@gbelaaj.pk",
      name: "Demo Lab Admin",
      role: Role.LAB_ADMIN,
    });
    const lab = await prisma.lab.upsert({
      where: { ownerUserId: user.id },
      create: {
        ownerUserId: user.id,
        name: "Demo Diagnostics",
        slug: "demo-diagnostics",
        cityId: gilgit.id,
        license: "DEMO-LAB-001",
        verified: true,
        active: true,
      },
      update: {},
    });
    const tests = [
      { slug: "cbc", nameEn: "Complete Blood Count (CBC)", nameUr: "خون کا مکمل تجزیہ", description: "Routine CBC", sampleType: "Blood", fastingRequired: false, turnaroundHrs: 24, pricePaisa: 80000, homeEligible: true },
      { slug: "lipid", nameEn: "Lipid Profile", nameUr: "لپڈ پروفائل", description: "Cholesterol panel", sampleType: "Blood", fastingRequired: true, turnaroundHrs: 24, pricePaisa: 150000, homeEligible: true },
      { slug: "fbs", nameEn: "Fasting Blood Sugar", nameUr: "روزے میں شوگر", description: "Glucose fasting", sampleType: "Blood", fastingRequired: true, turnaroundHrs: 6, pricePaisa: 30000, homeEligible: true },
      { slug: "hba1c", nameEn: "HbA1c", nameUr: "ایچ بی اے ون سی", description: "Diabetes 3-month avg", sampleType: "Blood", fastingRequired: false, turnaroundHrs: 24, pricePaisa: 180000, homeEligible: true },
      { slug: "tsh", nameEn: "TSH (Thyroid)", nameUr: "تھائرائڈ", description: "Thyroid function", sampleType: "Blood", fastingRequired: false, turnaroundHrs: 24, pricePaisa: 220000, homeEligible: true },
      { slug: "lft", nameEn: "Liver Function Test", nameUr: "جگر کا فنکشن", description: "LFT", sampleType: "Blood", fastingRequired: false, turnaroundHrs: 24, pricePaisa: 200000, homeEligible: true },
      { slug: "covid-pcr", nameEn: "COVID-19 PCR", nameUr: "کوویڈ ٹیسٹ", description: "PCR", sampleType: "Swab", fastingRequired: false, turnaroundHrs: 24, pricePaisa: 600000, homeEligible: true },
      { slug: "urine", nameEn: "Urine Routine", nameUr: "پیشاب کا تجزیہ", description: "Urinalysis", sampleType: "Urine", fastingRequired: false, turnaroundHrs: 6, pricePaisa: 25000, homeEligible: false },
    ];
    for (const t of tests) {
      await prisma.labTest.upsert({
        where: { labId_slug: { labId: lab.id, slug: t.slug } },
        create: { labId: lab.id, ...t },
        update: {},
      });
    }
    console.log(`  · upsert ${tests.length} demo lab tests`);
    summary.push({ email: user.email, role: Role.LAB_ADMIN, password: created ? password! : "EXISTING" });
  }

  // ── Nurse + NurseProfile ───────────────────────────────────────
  {
    const { user, created, password } = await ensureUser({
      email: "demo-nurse@gbelaaj.pk",
      name: "Demo Nurse",
      role: Role.NURSE,
    });
    await prisma.nurseProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        level: "SENIOR",
        cityId: lahore.id,
        verified: true,
        active: true,
      },
      update: {},
    });
    summary.push({ email: user.email, role: Role.NURSE, password: created ? password! : "EXISTING" });
  }

  // ── Finance ────────────────────────────────────────────────────
  {
    const { user, created, password } = await ensureUser({
      email: "demo-finance@gbelaaj.pk",
      name: "Demo Finance",
      role: Role.FINANCE,
    });
    summary.push({ email: user.email, role: Role.FINANCE, password: created ? password! : "EXISTING" });
  }

  // ── Output ─────────────────────────────────────────────────────
  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("✓ Demo users provisioned (idempotent)");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
  for (const s of summary) {
    const padRole = s.role.padEnd(15);
    const padEmail = s.email.padEnd(30);
    if (s.password === "EXISTING") {
      console.log(`  ${padRole} ${padEmail} EXISTING — unchanged`);
    } else {
      console.log(`  ${padRole} ${padEmail} ${s.password}  (NEW)`);
    }
  }
  console.log("");
  console.log("  Save these credentials — they are NOT stored anywhere else.");
  console.log("  Sign in: https://gb-elaaj.vercel.app/login");
  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
