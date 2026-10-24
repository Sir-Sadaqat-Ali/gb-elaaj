import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning all dummy and test records from database...");

  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.medicalRecord.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.doctorAvailability.deleteMany(),
    prisma.pharmacyOrderItem.deleteMany(),
    prisma.pharmacyOrder.deleteMany(),
    prisma.medicine.deleteMany(),
    prisma.pharmacy.deleteMany(),
    prisma.labReport.deleteMany(),
    prisma.labBooking.deleteMany(),
    prisma.labTest.deleteMany(),
    prisma.lab.deleteMany(),
    prisma.homeCareRequest.deleteMany(),
    prisma.nurseLocation.deleteMany(),
    prisma.nurseProfile.deleteMany(),
    prisma.doctorSpecialty.deleteMany(),
    prisma.savedDoctor.deleteMany(),
    prisma.prescriptionTemplate.deleteMany(),
    prisma.doctorProfile.deleteMany(),
    prisma.patientProfile.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log("✅ All dummy records wiped successfully.");
  console.log("🌱 Setting up official reference data (Cities, Specialties, Platform Settings)...");

  // Platform Settings
  await prisma.platformSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      commissionBps: 1500, // 15%
      commissionOverrides: { PHARMACY: 800, LAB: 1200, HOME_CARE: 1500 },
      currency: "PKR",
      slotMinutes: 20,
      reminderHoursBefore: 2,
      appName: "Gb Elaaj",
    },
  });

  // Cities
  const cities = [
    { slug: "gilgit", nameEn: "Gilgit", nameUr: "گلگت", province: "GB" },
    { slug: "skardu", nameEn: "Skardu", nameUr: "سکردو", province: "GB" },
    { slug: "hunza", nameEn: "Hunza", nameUr: "ہنزہ", province: "GB" },
    { slug: "islamabad", nameEn: "Islamabad", nameUr: "اسلام آباد", province: "ICT" },
    { slug: "lahore", nameEn: "Lahore", nameUr: "لاہور", province: "Punjab" },
    { slug: "karachi", nameEn: "Karachi", nameUr: "کراچی", province: "Sindh" },
    { slug: "peshawar", nameEn: "Peshawar", nameUr: "پشاور", province: "KPK" },
    { slug: "rawalpindi", nameEn: "Rawalpindi", nameUr: "راولپنڈی", province: "Punjab" },
  ];
  for (const c of cities) {
    await prisma.city.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  // Specialties
  const specialties = [
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
  for (const s of specialties) {
    await prisma.specialty.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }

  // Official Master Admin
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@gbelaaj.pk";
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || "admin1234";
  const adminName = process.env.BOOTSTRAP_ADMIN_NAME || "Super Admin";

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });

  console.log(`\n🎉 Production Reset Complete!`);
  console.log(`Master Admin: ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log(`All fake patients, fake doctors, and dummy records have been removed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
