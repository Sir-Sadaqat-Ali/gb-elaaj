// ─────────────────────────────────────────────────────────────
// Gb Elaaj — Production bootstrap
// Run once after the first `prisma migrate deploy` on a fresh
// production database. Idempotent: safe to re-run.
//
// Inserts ONLY reference data + a single super-admin:
//   - Platform settings (commission rate, currency, slot length)
//   - Cities + specialties (the catalogues every page uses)
//   - One super-admin user from BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD
//
// Run: pnpm db:bootstrap
// ─────────────────────────────────────────────────────────────

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("⚙️  Bootstrapping Gb Elaaj reference data…");

  // ── Platform settings ─────────────────────────────────────
  await prisma.platformSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      commissionBps: 1500,
      commissionOverrides: { PHARMACY: 800, LAB: 1200, HOME_CARE: 1500 },
      currency: "PKR",
      slotMinutes: 20,
      reminderHoursBefore: 2,
      appName: "Gb Elaaj",
    },
  });
  console.log("  ✓ Platform settings");

  // ── Cities ────────────────────────────────────────────────
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
  for (const c of cityData) {
    await prisma.city.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }
  console.log(`  ✓ ${cityData.length} cities`);

  // ── Specialties ───────────────────────────────────────────
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
  for (const s of specialtyData) {
    await prisma.specialty.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }
  console.log(`  ✓ ${specialtyData.length} specialties`);

  // ── Super admin (idempotent) ──────────────────────────────
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const adminName = process.env.BOOTSTRAP_ADMIN_NAME ?? "Super Admin";

  if (adminEmail && adminPassword) {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          passwordHash: await bcrypt.hash(adminPassword, 12),
          role: Role.ADMIN,
        },
      });
      console.log(`  ✓ Created super-admin ${adminEmail}`);
    } else {
      console.log(`  · Super-admin ${adminEmail} already exists — skipped`);
    }
  } else {
    console.log("  · Skipped super-admin (set BOOTSTRAP_ADMIN_EMAIL + BOOTSTRAP_ADMIN_PASSWORD to provision one)");
  }

  console.log("\n✅ Bootstrap complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
