// ─────────────────────────────────────────────────────────────
// Gb Elaaj — Seed script
// Run: pnpm db:seed
// Creates: 1 admin, 1 finance, 2 pharmacies, 2 labs, 2 nurses,
//          8 doctors, 6 patients, specialties, cities, medicines,
//          lab tests, sample appointments + reviews + transactions.
// Supply SEED_DEMO_PASSWORD through the environment before creating demo accounts.
// ─────────────────────────────────────────────────────────────

import { PrismaClient, Role, Gender, ConsultMode, AppointmentStatus, SlotStatus, TransactionKind, TransactionStatus, MedicalRecordType, DoctorVerificationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PORTRAITS = {
  m1: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=240&h=240&fit=crop&crop=faces&q=80",
  m2: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=240&h=240&fit=crop&crop=faces&q=80",
  m3: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=240&h=240&fit=crop&crop=faces&q=80",
  m4: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=240&h=240&fit=crop&crop=faces&q=80",
  f1: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=240&h=240&fit=crop&crop=faces&q=80",
  f2: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=240&h=240&fit=crop&crop=faces&q=80",
  f3: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=240&h=240&fit=crop&crop=faces&q=80",
  f4: "https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=240&h=240&fit=crop&crop=faces&q=80",
  pat1: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=faces&q=80",
  pat2: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop&crop=faces&q=80",
  pat3: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=160&h=160&fit=crop&crop=faces&q=80",
};

async function hash(p: string) {
  return bcrypt.hash(p, 10);
}

async function main() {
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (!demoPassword || demoPassword.length < 12) {
    throw new Error("Set SEED_DEMO_PASSWORD to at least 12 characters before seeding.");
  }

  // ── Production safety guard ─────────────────────────────────
  // This seed wipes every table before re-inserting demo data.
  // It must NEVER run against a production database.
  // Set ALLOW_DESTRUCTIVE_SEED=1 to bypass (e.g. for staging resets).
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DESTRUCTIVE_SEED !== "1") {
    console.error("✋ Refusing to run destructive seed in production.");
    console.error("   For a fresh prod database, run pnpm db:bootstrap instead (cities, specialties, platform settings only).");
    process.exit(1);
  }

  console.log("🌱 Seeding Gb Elaaj...");

  // Reset (development only — guards against running on prod data)
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.medicalRecord.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.doctorAvailability.deleteMany(),
    prisma.pharmacyOrderItem.deleteMany(),
    prisma.pharmacyOrder.deleteMany(),
    prisma.medicine.deleteMany(),
    prisma.labReport.deleteMany(),
    prisma.labBooking.deleteMany(),
    prisma.labTest.deleteMany(),
    prisma.homeCareRequest.deleteMany(),
    prisma.withdrawal.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.doctorSpecialty.deleteMany(),
    prisma.nurseProfile.deleteMany(),
    prisma.pharmacy.deleteMany(),
    prisma.lab.deleteMany(),
    prisma.doctorProfile.deleteMany(),
    prisma.patientProfile.deleteMany(),
    prisma.specialty.deleteMany(),
    prisma.city.deleteMany(),
    prisma.platformSetting.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ── Platform settings ───────────────────────────────────────
  await prisma.platformSetting.create({
    data: {
      id: "singleton",
      commissionBps: 1500, // 15%
      commissionOverrides: { PHARMACY: 800, LAB: 1200, HOME_CARE: 1500 },
      currency: "PKR",
      slotMinutes: 20,
      reminderHoursBefore: 2,
      appName: "Gb Elaaj",
    },
  });

  // ── Cities ──────────────────────────────────────────────────
  const cityData = [
    { slug: "gilgit", nameEn: "Gilgit", nameUr: "گلگت", province: "GB" },
    { slug: "skardu", nameEn: "Skardu", nameUr: "سکردو", province: "GB" },
    { slug: "hunza", nameEn: "Hunza", nameUr: "ہنزہ", province: "GB" },
    { slug: "islamabad", nameEn: "Islamabad", nameUr: "اسلام آباد", province: "ICT" },
    { slug: "lahore", nameEn: "Lahore", nameUr: "لاہور", province: "Punjab" },
    { slug: "karachi", nameEn: "Karachi", nameUr: "کراچی", province: "Sindh" },
    { slug: "peshawar", nameEn: "Peshawar", nameUr: "پشاور", province: "KPK" },
    { slug: "rawalpindi", nameEn: "Rawalpindi", nameUr: "راولپنڈی", province: "Punjab" },
  ];
  await prisma.city.createMany({ data: cityData });
  const cities = await prisma.city.findMany();
  const cityBy = (slug: string) => cities.find((c) => c.slug === slug)!;

  // ── Specialties ─────────────────────────────────────────────
  const specialtyData = [
    { slug: "cardiology", nameEn: "Cardiology", nameUr: "امراض قلب", iconKey: "Heart" },
    { slug: "general-physician", nameEn: "General Physician", nameUr: "عام معالج", iconKey: "Stethoscope" },
    { slug: "gynecology", nameEn: "Gynecology", nameUr: "زنانہ", iconKey: "User" },
    { slug: "dermatology", nameEn: "Dermatology", nameUr: "جلد", iconKey: "Spark" },
    { slug: "pediatrics", nameEn: "Pediatrics", nameUr: "اطفال", iconKey: "Users" },
    { slug: "orthopedic", nameEn: "Orthopedic", nameUr: "ہڈی", iconKey: "Activity" },
    { slug: "ent", nameEn: "ENT Specialist", nameUr: "ناک کان گلا", iconKey: "Headset" },
    { slug: "psychiatry", nameEn: "Psychiatry", nameUr: "نفسیات", iconKey: "Brain" },
    { slug: "dentistry", nameEn: "Dentistry", nameUr: "دانت", iconKey: "Plus" },
    { slug: "eye-specialist", nameEn: "Eye Specialist", nameUr: "آنکھ", iconKey: "Eye" },
  ];
  await prisma.specialty.createMany({ data: specialtyData });
  const specialties = await prisma.specialty.findMany();
  const specBy = (slug: string) => specialties.find((s) => s.slug === slug)!;

  // ── Super Admin ─────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      name: "Hassan Iqbal",
      email: "admin@gbelaaj.pk",
      passwordHash: await hash(demoPassword),
      role: Role.ADMIN,
    },
  });

  // ── Finance Admin ───────────────────────────────────────────
  const finance = await prisma.user.create({
    data: {
      name: "Maira Khan",
      email: "finance@gbelaaj.pk",
      passwordHash: await hash(demoPassword),
      role: Role.FINANCE,
    },
  });

  // ── Pharmacy admins (2) ─────────────────────────────────────
  const pharmacy1Owner = await prisma.user.create({
    data: {
      name: "Wahab Hussain",
      email: "pharmacy@gbelaaj.pk",
      passwordHash: await hash(demoPassword),
      role: Role.PHARMACY_ADMIN,
    },
  });
  const pharmacy1 = await prisma.pharmacy.create({
    data: {
      ownerUserId: pharmacy1Owner.id,
      name: "Wahab Pharmacy",
      slug: "wahab-pharmacy",
      cityId: cityBy("karachi").id,
      license: "PH-KHI-2024-0421",
      verified: true,
    },
  });
  const pharmacy2Owner = await prisma.user.create({
    data: {
      name: "Hina Zahid",
      email: "pharmacy2@gbelaaj.pk",
      passwordHash: await hash(demoPassword),
      role: Role.PHARMACY_ADMIN,
    },
  });
  const pharmacy2 = await prisma.pharmacy.create({
    data: {
      ownerUserId: pharmacy2Owner.id,
      name: "Gilgit Care Pharmacy",
      slug: "gilgit-care-pharmacy",
      cityId: cityBy("gilgit").id,
      license: "PH-GIL-2024-0118",
      verified: true,
    },
  });

  // Medicines for pharmacy 1 + 2
  const medicineSeed = [
    { sku: "ATEN-50", nameGeneric: "Atenolol", nameBrand: "Tenormin", form: "tablet", strength: "50mg", manufacturer: "AGP", pricePaisa: 18000, mrpPaisa: 21000, stock: 220, reorderLevel: 30, rxRequired: true },
    { sku: "MET-500", nameGeneric: "Metformin", nameBrand: "Glucophage", form: "tablet", strength: "500mg", manufacturer: "Merck", pricePaisa: 9500, mrpPaisa: 12000, stock: 380, reorderLevel: 40, rxRequired: true },
    { sku: "AMOX-625", nameGeneric: "Amoxicillin/Clavulanate", nameBrand: "Augmentin", form: "tablet", strength: "625mg", manufacturer: "GSK", pricePaisa: 32000, mrpPaisa: 38000, stock: 90, reorderLevel: 20, rxRequired: true },
    { sku: "PARA-500", nameGeneric: "Paracetamol", nameBrand: "Panadol", form: "tablet", strength: "500mg", manufacturer: "GSK", pricePaisa: 4500, mrpPaisa: 5500, stock: 1200, reorderLevel: 100, rxRequired: false },
    { sku: "ORS-X", nameGeneric: "ORS Sachet", nameBrand: "ORS Plus", form: "sachet", strength: "21g", manufacturer: "Searle", pricePaisa: 2500, mrpPaisa: 3000, stock: 600, reorderLevel: 80, rxRequired: false },
    { sku: "LOR-10", nameGeneric: "Loratadine", nameBrand: "Softec", form: "tablet", strength: "10mg", manufacturer: "Hilton", pricePaisa: 6000, mrpPaisa: 7500, stock: 150, reorderLevel: 25, rxRequired: false },
    { sku: "ATOR-20", nameGeneric: "Atorvastatin", nameBrand: "Lipiget", form: "tablet", strength: "20mg", manufacturer: "Getz", pricePaisa: 16500, mrpPaisa: 19500, stock: 320, reorderLevel: 40, rxRequired: true },
    { sku: "OMEP-20", nameGeneric: "Omeprazole", nameBrand: "Risek", form: "capsule", strength: "20mg", manufacturer: "Getz", pricePaisa: 8500, mrpPaisa: 10500, stock: 280, reorderLevel: 35, rxRequired: false },
    { sku: "VITD-50K", nameGeneric: "Vitamin D3", nameBrand: "Sunny D", form: "capsule", strength: "50,000IU", manufacturer: "Hilton", pricePaisa: 7000, mrpPaisa: 8500, stock: 200, reorderLevel: 30, rxRequired: false },
    { sku: "MULTI-A", nameGeneric: "Multivitamins", nameBrand: "Surbex Z", form: "tablet", strength: "—", manufacturer: "Abbott", pricePaisa: 11000, mrpPaisa: 13500, stock: 240, reorderLevel: 30, rxRequired: false },
  ];
  for (const m of medicineSeed) {
    await prisma.medicine.create({ data: { ...m, pharmacyId: pharmacy1.id } });
  }
  // Half also at pharmacy 2 with different stock
  for (const m of medicineSeed.slice(0, 6)) {
    await prisma.medicine.create({ data: { ...m, pharmacyId: pharmacy2.id, stock: Math.floor(m.stock / 2), sku: m.sku } });
  }

  // ── Lab admins (2) ──────────────────────────────────────────
  const lab1Owner = await prisma.user.create({
    data: {
      name: "Chughtai Lab Admin",
      email: "lab@gbelaaj.pk",
      passwordHash: await hash(demoPassword),
      role: Role.LAB_ADMIN,
    },
  });
  const lab1 = await prisma.lab.create({
    data: {
      ownerUserId: lab1Owner.id,
      name: "Chughtai Lab GB",
      slug: "chughtai-lab-gb",
      cityId: cityBy("gilgit").id,
      license: "LAB-GIL-2023-0091",
      verified: true,
    },
  });
  const lab2Owner = await prisma.user.create({
    data: {
      name: "Excel Lab Admin",
      email: "lab2@gbelaaj.pk",
      passwordHash: await hash(demoPassword),
      role: Role.LAB_ADMIN,
    },
  });
  const lab2 = await prisma.lab.create({
    data: {
      ownerUserId: lab2Owner.id,
      name: "Excel Diagnostics",
      slug: "excel-diagnostics",
      cityId: cityBy("islamabad").id,
      license: "LAB-ISB-2022-0188",
      verified: true,
    },
  });

  const labTestSeed = [
    { slug: "cbc", nameEn: "Complete Blood Count (CBC)", sampleType: "blood", fastingRequired: false, turnaroundHrs: 6, pricePaisa: 80000, homeEligible: true },
    { slug: "lipid-profile", nameEn: "Lipid Profile", sampleType: "blood", fastingRequired: true, turnaroundHrs: 8, pricePaisa: 180000, homeEligible: true },
    { slug: "hba1c", nameEn: "HbA1c", sampleType: "blood", fastingRequired: false, turnaroundHrs: 12, pricePaisa: 220000, homeEligible: true },
    { slug: "thyroid-panel", nameEn: "Thyroid Panel (T3, T4, TSH)", sampleType: "blood", fastingRequired: false, turnaroundHrs: 24, pricePaisa: 280000, homeEligible: true },
    { slug: "vitamin-d", nameEn: "Vitamin D 25-OH", sampleType: "blood", fastingRequired: false, turnaroundHrs: 24, pricePaisa: 320000, homeEligible: true },
    { slug: "lft", nameEn: "Liver Function Test", sampleType: "blood", fastingRequired: true, turnaroundHrs: 8, pricePaisa: 200000, homeEligible: true },
    { slug: "rft", nameEn: "Renal Function Test", sampleType: "blood", fastingRequired: false, turnaroundHrs: 8, pricePaisa: 180000, homeEligible: true },
    { slug: "urine-routine", nameEn: "Urine Routine Examination", sampleType: "urine", fastingRequired: false, turnaroundHrs: 4, pricePaisa: 50000, homeEligible: true },
    { slug: "covid-pcr", nameEn: "COVID-19 PCR", sampleType: "swab", fastingRequired: false, turnaroundHrs: 24, pricePaisa: 450000, homeEligible: true },
    { slug: "ecg", nameEn: "ECG", sampleType: "—", fastingRequired: false, turnaroundHrs: 2, pricePaisa: 100000, homeEligible: false },
    { slug: "echo", nameEn: "Echocardiography", sampleType: "—", fastingRequired: false, turnaroundHrs: 24, pricePaisa: 600000, homeEligible: false },
    { slug: "x-ray-chest", nameEn: "X-Ray Chest", sampleType: "—", fastingRequired: false, turnaroundHrs: 4, pricePaisa: 150000, homeEligible: false },
  ];
  for (const t of labTestSeed) {
    await prisma.labTest.create({ data: { ...t, labId: lab1.id } });
  }
  for (const t of labTestSeed.slice(0, 8)) {
    await prisma.labTest.create({ data: { ...t, labId: lab2.id } });
  }

  // ── Nurses (2) ──────────────────────────────────────────────
  const nurse1User = await prisma.user.create({
    data: {
      name: "Nurse Rabia",
      email: "nurse@gbelaaj.pk",
      passwordHash: await hash(demoPassword),
      role: Role.NURSE,
      image: PORTRAITS.f4,
    },
  });
  await prisma.nurseProfile.create({
    data: {
      userId: nurse1User.id,
      level: "SENIOR",
      cityId: cityBy("lahore").id,
      verified: true,
      ratingAvg: 4.9,
    },
  });
  const nurse2User = await prisma.user.create({
    data: {
      name: "Nurse Salma",
      email: "nurse2@gbelaaj.pk",
      passwordHash: await hash(demoPassword),
      role: Role.NURSE,
      image: PORTRAITS.f3,
    },
  });
  await prisma.nurseProfile.create({
    data: {
      userId: nurse2User.id,
      level: "JUNIOR",
      cityId: cityBy("islamabad").id,
      verified: true,
      ratingAvg: 4.7,
    },
  });

  // ── Doctors (8) ─────────────────────────────────────────────
  const doctorSeed = [
    { name: "Dr. Ayesha Khan", email: "doctor@gbelaaj.pk", slug: "dr-ayesha-khan", pmdc: "PMC-12849-IS", spec: "cardiology", city: "islamabad", clinic: "Shifa International", quals: "MBBS, FCPS (Cardiology)", years: 14, fee: 250000, clinicFee: 300000, image: PORTRAITS.f1, rating: 4.9, ratings: 412, sat: 98, modes: [ConsultMode.VIDEO, ConsultMode.CLINIC] },
    { name: "Dr. Imran Hussain", email: "doctor2@gbelaaj.pk", slug: "dr-imran-hussain", pmdc: "PMC-22941-GB", spec: "general-physician", city: "gilgit", clinic: "Gilgit Medical Centre", quals: "MBBS, MD (Internal Medicine)", years: 9, fee: 150000, clinicFee: 180000, image: PORTRAITS.m1, rating: 4.8, ratings: 308, sat: 96, modes: [ConsultMode.VIDEO, ConsultMode.CLINIC] },
    { name: "Dr. Saima Baig", email: "doctor3@gbelaaj.pk", slug: "dr-saima-baig", pmdc: "PMC-19228-LH", spec: "gynecology", city: "lahore", clinic: "Hameed Latif Hospital", quals: "MBBS, FCPS (Gynae & Obs)", years: 18, fee: 300000, clinicFee: 350000, image: PORTRAITS.f2, rating: 4.9, ratings: 624, sat: 99, modes: [ConsultMode.CLINIC] },
    { name: "Dr. Faisal Karim", email: "doctor4@gbelaaj.pk", slug: "dr-faisal-karim", pmdc: "PMC-24891-SK", spec: "dermatology", city: "skardu", clinic: "Skardu Skin & Care", quals: "MBBS, FCPS (Dermatology)", years: 11, fee: 220000, clinicFee: 0, image: PORTRAITS.m2, rating: 4.7, ratings: 187, sat: 95, modes: [ConsultMode.VIDEO] },
    { name: "Dr. Mehwish Ali", email: "doctor5@gbelaaj.pk", slug: "dr-mehwish-ali", pmdc: "PMC-19228-KH", spec: "pediatrics", city: "karachi", clinic: "Liaquat National", quals: "MBBS, DCH, FCPS", years: 12, fee: 180000, clinicFee: 220000, image: PORTRAITS.f3, rating: 4.9, ratings: 521, sat: 98, modes: [ConsultMode.VIDEO, ConsultMode.CLINIC] },
    { name: "Dr. Tariq Mehmood", email: "doctor6@gbelaaj.pk", slug: "dr-tariq-mehmood", pmdc: "PMC-34102-IS", spec: "orthopedic", city: "islamabad", clinic: "CMH Rawalpindi", quals: "MBBS, FRCS (Ortho)", years: 21, fee: 350000, clinicFee: 400000, image: PORTRAITS.m3, rating: 4.8, ratings: 289, sat: 96, modes: [ConsultMode.CLINIC] },
    { name: "Dr. Hina Shah", email: "doctor7@gbelaaj.pk", slug: "dr-hina-shah", pmdc: "PMC-40192-HZ", spec: "dermatology", city: "hunza", clinic: "Hunza Wellness", quals: "MBBS, MD (Dermatology)", years: 8, fee: 200000, clinicFee: 240000, image: PORTRAITS.f4, rating: 4.7, ratings: 142, sat: 95, modes: [ConsultMode.VIDEO, ConsultMode.CLINIC] },
    { name: "Dr. Bilal Anwar", email: "doctor8@gbelaaj.pk", slug: "dr-bilal-anwar", pmdc: "PMC-28814-LH", spec: "cardiology", city: "lahore", clinic: "Punjab Institute of Cardiology", quals: "MBBS, MRCP (UK)", years: 15, fee: 320000, clinicFee: 360000, image: PORTRAITS.m4, rating: 4.8, ratings: 367, sat: 97, modes: [ConsultMode.VIDEO, ConsultMode.CLINIC] },
  ];

  const createdDoctors: { id: string; userId: string; slug: string; specSlug: string }[] = [];
  for (const d of doctorSeed) {
    const u = await prisma.user.create({
      data: {
        name: d.name,
        email: d.email,
        passwordHash: await hash(demoPassword),
        role: Role.DOCTOR,
        image: d.image,
      },
    });
    const profile = await prisma.doctorProfile.create({
      data: {
        userId: u.id,
        slug: d.slug,
        pmdcNumber: d.pmdc,
        qualifications: d.quals,
        bioEn: `${d.name} is a senior ${d.spec.replace("-", " ")} specialist with ${d.years} years of clinical experience. Verified by PMDC and reviewed by the Gb Elaaj medical board.`,
        experienceYears: d.years,
        consultFeePaisa: d.fee,
        clinicFeePaisa: d.clinicFee,
        cityId: cityBy(d.city).id,
        clinic: d.clinic,
        languages: ["English", "Urdu"],
        ratingAvg: d.rating,
        ratingCount: d.ratings,
        satisfactionPct: d.sat,
        verifiedStatus: DoctorVerificationStatus.APPROVED,
        verifiedAt: new Date(),
        modes: d.modes,
      },
    });
    await prisma.doctorSpecialty.create({
      data: {
        doctorId: profile.id,
        specialtyId: specBy(d.spec).id,
      },
    });
    createdDoctors.push({ id: profile.id, userId: u.id, slug: profile.slug, specSlug: d.spec });
  }

  // ── Patients (6) ────────────────────────────────────────────
  const patientSeed = [
    { name: "Sana Yousaf", email: "patient@gbelaaj.pk", phone: "+923111000001", city: "gilgit", gender: Gender.FEMALE, image: PORTRAITS.pat1 },
    { name: "Bilal Ahmed", email: "patient2@gbelaaj.pk", phone: "+923111000002", city: "islamabad", gender: Gender.MALE, image: PORTRAITS.pat2 },
    { name: "Hira Mansoor", email: "patient3@gbelaaj.pk", phone: "+923111000003", city: "lahore", gender: Gender.FEMALE, image: PORTRAITS.pat3 },
    { name: "Kamran Riaz", email: "patient4@gbelaaj.pk", phone: "+923111000004", city: "skardu", gender: Gender.MALE },
    { name: "Naila Sheikh", email: "patient5@gbelaaj.pk", phone: "+923111000005", city: "karachi", gender: Gender.FEMALE },
    { name: "Adnan Saleem", email: "patient6@gbelaaj.pk", phone: "+923111000006", city: "rawalpindi", gender: Gender.MALE },
  ];
  const patients: { id: string; userId: string }[] = [];
  for (const p of patientSeed) {
    const u = await prisma.user.create({
      data: {
        name: p.name,
        email: p.email,
        phone: p.phone,
        passwordHash: await hash(demoPassword),
        role: Role.PATIENT,
        image: p.image,
      },
    });
    const prof = await prisma.patientProfile.create({
      data: {
        userId: u.id,
        gender: p.gender,
        cityId: cityBy(p.city).id,
        addressLine: `${p.name} residence, ${p.city}`,
      },
    });
    patients.push({ id: prof.id, userId: u.id });
  }

  // ── Doctor availability — open slots for the next 5 days ────
  const now = new Date();
  for (const doc of createdDoctors) {
    for (let day = 0; day < 5; day++) {
      const base = new Date(now);
      base.setDate(now.getDate() + day);
      base.setHours(10, 0, 0, 0);
      // 6 slots per day — every 30 min
      for (let i = 0; i < 6; i++) {
        const startsAt = new Date(base.getTime() + i * 30 * 60 * 1000);
        const endsAt = new Date(startsAt.getTime() + 20 * 60 * 1000);
        await prisma.doctorAvailability.create({
          data: {
            doctorId: doc.id,
            startsAt,
            endsAt,
            mode: ConsultMode.VIDEO,
            status: SlotStatus.OPEN,
          },
        });
      }
    }
  }

  // ── Sample appointments (3) — one upcoming, one in-progress, one completed
  const drAyesha = createdDoctors.find((d) => d.slug === "dr-ayesha-khan")!;
  const drImran = createdDoctors.find((d) => d.slug === "dr-imran-hussain")!;
  const sana = patients[0];
  const bilal = patients[1];
  const hira = patients[2];

  // Upcoming — 4:30 PM today
  const today430 = new Date();
  today430.setHours(16, 30, 0, 0);
  if (today430.getTime() <= now.getTime()) today430.setDate(today430.getDate() + 1);
  const upSlot = await prisma.doctorAvailability.create({
    data: {
      doctorId: drAyesha.id,
      startsAt: today430,
      endsAt: new Date(today430.getTime() + 20 * 60 * 1000),
      mode: ConsultMode.VIDEO,
      status: SlotStatus.BOOKED,
    },
  });
  const apptUpcoming = await prisma.appointment.create({
    data: {
      patientId: sana.id,
      doctorId: drAyesha.id,
      slotId: upSlot.id,
      mode: ConsultMode.VIDEO,
      status: AppointmentStatus.CONFIRMED,
      feePaisa: 250000,
      symptoms: "BP elevated last 3 readings; mild dizziness in mornings.",
      scheduledFor: today430,
      durationMin: 20,
      videoRoomId: "room-demo-001",
      videoJoinUrl: "/patient/appointments/demo/video",
    },
  });
  await prisma.transaction.create({
    data: {
      kind: TransactionKind.CONSULTATION,
      status: TransactionStatus.SUCCEEDED,
      grossPaisa: 250000,
      commissionPaisa: 37500,
      netPaisa: 212500,
      provider: "stripe",
      providerRef: "tx_demo_001",
      payerUserId: (await prisma.patientProfile.findUnique({ where: { id: sana.id }, include: { user: true } }))!.user.id,
      providerRole: Role.DOCTOR,
      providerId: drAyesha.id,
      appointmentId: apptUpcoming.id,
      capturedAt: new Date(),
    },
  });

  // Completed — yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  yesterday.setHours(11, 0, 0, 0);
  const apptCompleted = await prisma.appointment.create({
    data: {
      patientId: bilal.id,
      doctorId: drImran.id,
      mode: ConsultMode.VIDEO,
      status: AppointmentStatus.COMPLETED,
      feePaisa: 150000,
      symptoms: "Routine BP follow-up.",
      scheduledFor: yesterday,
      durationMin: 20,
      startedAt: yesterday,
      endedAt: new Date(yesterday.getTime() + 20 * 60 * 1000),
    },
  });
  await prisma.transaction.create({
    data: {
      kind: TransactionKind.CONSULTATION,
      status: TransactionStatus.SUCCEEDED,
      grossPaisa: 150000,
      commissionPaisa: 22500,
      netPaisa: 127500,
      provider: "jazzcash",
      providerRef: "tx_demo_002",
      payerUserId: (await prisma.patientProfile.findUnique({ where: { id: bilal.id }, include: { user: true } }))!.user.id,
      providerRole: Role.DOCTOR,
      providerId: drImran.id,
      appointmentId: apptCompleted.id,
      capturedAt: yesterday,
    },
  });
  await prisma.medicalRecord.create({
    data: {
      patientId: bilal.id,
      doctorId: drImran.id,
      appointmentId: apptCompleted.id,
      type: MedicalRecordType.PRESCRIPTION,
      title: "Prescription · BP follow-up",
      body: "Continue current Atenolol 50mg OD. Re-check BP in 2 weeks.",
      data: {
        rxLines: [
          { drug: "Atenolol", strength: "50mg", frequency: "OD", durationDays: 14 },
        ],
      },
    },
  });

  // Past appointment with a review
  const lastWeek = new Date(now);
  lastWeek.setDate(now.getDate() - 7);
  const apptReviewed = await prisma.appointment.create({
    data: {
      patientId: hira.id,
      doctorId: drAyesha.id,
      mode: ConsultMode.VIDEO,
      status: AppointmentStatus.COMPLETED,
      feePaisa: 250000,
      scheduledFor: lastWeek,
      startedAt: lastWeek,
      endedAt: new Date(lastWeek.getTime() + 20 * 60 * 1000),
    },
  });
  const hiraUser = await prisma.patientProfile.findUnique({ where: { id: hira.id }, include: { user: true } });
  await prisma.review.create({
    data: {
      appointmentId: apptReviewed.id,
      patientId: hira.id,
      doctorId: drAyesha.id,
      authorUserId: hiraUser!.user.id,
      rating: 5,
      text: "The booking flow is so clean. I love that my entire family's prescriptions and lab reports live in one place.",
    },
  });
  await prisma.transaction.create({
    data: {
      kind: TransactionKind.CONSULTATION,
      status: TransactionStatus.SUCCEEDED,
      grossPaisa: 250000,
      commissionPaisa: 37500,
      netPaisa: 212500,
      provider: "stripe",
      providerRef: "tx_demo_003",
      payerUserId: hiraUser!.user.id,
      providerRole: Role.DOCTOR,
      providerId: drAyesha.id,
      appointmentId: apptReviewed.id,
      capturedAt: lastWeek,
    },
  });

  // ── Sample pharmacy order ───────────────────────────────────
  const sanaUser = await prisma.patientProfile.findUnique({ where: { id: sana.id }, include: { user: true } });
  const meds = await prisma.medicine.findMany({ where: { pharmacyId: pharmacy1.id }, take: 3 });
  const subtotal = meds.reduce((acc, m) => acc + m.pricePaisa * 2, 0);
  const orderTotal = subtotal + 15000; // delivery
  const order = await prisma.pharmacyOrder.create({
    data: {
      patientId: sana.id,
      pharmacyId: pharmacy1.id,
      status: "OUT_FOR_DELIVERY",
      subtotalPaisa: subtotal,
      deliveryPaisa: 15000,
      totalPaisa: orderTotal,
      addressLine: "House 14, Sector C, Gilgit",
      cityName: "Gilgit",
      items: {
        create: meds.map((m) => ({
          medicineId: m.id,
          qty: 2,
          unitPaisa: m.pricePaisa,
          totalPaisa: m.pricePaisa * 2,
        })),
      },
    },
  });
  await prisma.transaction.create({
    data: {
      kind: TransactionKind.PHARMACY,
      status: TransactionStatus.SUCCEEDED,
      grossPaisa: orderTotal,
      commissionPaisa: Math.round(orderTotal * 0.08),
      netPaisa: orderTotal - Math.round(orderTotal * 0.08),
      provider: "easypaisa",
      providerRef: "tx_demo_pharm_001",
      payerUserId: sanaUser!.user.id,
      providerRole: Role.PHARMACY_ADMIN,
      providerId: pharmacy1.id,
      pharmacyOrderId: order.id,
      capturedAt: new Date(),
    },
  });

  // ── Sample lab booking + report ─────────────────────────────
  const cbc = await prisma.labTest.findFirst({ where: { labId: lab1.id, slug: "cbc" } });
  if (cbc) {
    const lb = await prisma.labBooking.create({
      data: {
        patientId: sana.id,
        labId: lab1.id,
        testId: cbc.id,
        status: "REPORTED",
        mode: "HOME",
        scheduledFor: yesterday,
        addressLine: "House 14, Sector C, Gilgit",
        pricePaisa: cbc.pricePaisa,
        collectedAt: yesterday,
      },
    });
    await prisma.labReport.create({
      data: {
        bookingId: lb.id,
        results: {
          parameters: [
            { name: "Hemoglobin", value: "14.2", unit: "g/dL", range: "12-16", flag: "normal" },
            { name: "WBC Count", value: "7,800", unit: "/µL", range: "4000-11000", flag: "normal" },
            { name: "Platelets", value: "212K", unit: "/µL", range: "150-400K", flag: "normal" },
          ],
        },
        abnormal: false,
      },
    });
    await prisma.transaction.create({
      data: {
        kind: TransactionKind.LAB,
        status: TransactionStatus.SUCCEEDED,
        grossPaisa: cbc.pricePaisa,
        commissionPaisa: Math.round(cbc.pricePaisa * 0.12),
        netPaisa: cbc.pricePaisa - Math.round(cbc.pricePaisa * 0.12),
        provider: "stripe",
        providerRef: "tx_demo_lab_001",
        payerUserId: sanaUser!.user.id,
        providerRole: Role.LAB_ADMIN,
        providerId: lab1.id,
        labBookingId: lb.id,
        capturedAt: yesterday,
      },
    });
    await prisma.medicalRecord.create({
      data: {
        patientId: sana.id,
        type: MedicalRecordType.LAB_REPORT,
        title: "CBC — Chughtai Lab GB",
        body: "All parameters within normal range.",
        data: { abnormal: false },
        recordedAt: yesterday,
      },
    });
  }

  // ── Sample home-care request ────────────────────────────────
  const nurse1 = await prisma.nurseProfile.findFirst({ where: { city: { slug: "lahore" } } });
  if (nurse1) {
    await prisma.homeCareRequest.create({
      data: {
        patientId: hira.id,
        nurseId: nurse1.id,
        serviceName: "Wound dressing",
        description: "Daily wound dressing for post-op recovery.",
        status: "ASSIGNED",
        scheduledFor: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        durationMin: 60,
        addressLine: "House 22, DHA Phase 5, Lahore",
        pricePaisa: 250000,
      },
    });
  }

  // ── Notifications for patient[0] ────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: sanaUser!.user.id, title: "Appointment confirmed", body: "Your video consultation with Dr. Ayesha Khan is confirmed for today at 4:30 PM.", href: "/patient/appointments" },
      { userId: sanaUser!.user.id, title: "CBC report ready", body: "Your Complete Blood Count report from Chughtai Lab is now available.", href: "/patient/lab-reports" },
      { userId: sanaUser!.user.id, title: "Order out for delivery", body: "Pharmacy order is on the way. ETA 28 min.", href: "/patient/pharmacy" },
    ],
  });

  // Demo accounts are pre-verified so the seeded environment reflects a normal
  // verified state; email-verification enforcement then only affects real,
  // genuinely-unverified signups.
  await prisma.user.updateMany({ where: { emailVerified: null }, data: { emailVerified: new Date() } });

  console.log("✅ Seed complete.");
  console.log("Demo accounts use the supplied SEED_DEMO_PASSWORD.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
