"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, ConsultMode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const KNOWN_LANGUAGES = new Set(["English", "Urdu", "Shina", "Balti", "Wakhi", "Burushaski", "Khowar", "Pashto", "Punjabi"]);

/**
 * A doctor edits their own public profile. Verification-critical fields
 * (slug, pmdcNumber, verifiedStatus, name) and system-computed fields
 * (ratings) are intentionally NOT editable here.
 */
export async function updateDoctorProfileAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.DOCTOR) return;

  const doctor = await prisma.doctorProfile.findUnique({ where: { userId: session.user.id } });
  if (!doctor) return;

  const str = (k: string) => String(formData.get(k) ?? "").trim();
  // Fees entered in rupees, stored as paisa.
  const feePaisa = (k: string, fallback: number) => {
    const rupees = Number(formData.get(k));
    return Number.isFinite(rupees) && rupees >= 0 ? Math.round(rupees * 100) : fallback;
  };
  const years = Number(formData.get("experienceYears"));

  // Modes come as repeated checkbox values; keep only valid ones, never empty.
  const modes = (formData.getAll("modes") as string[]).filter((m): m is ConsultMode =>
    m === ConsultMode.VIDEO || m === ConsultMode.CLINIC
  );
  const languages = str("languages")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((l) => KNOWN_LANGUAGES.has(l))
    .slice(0, 8);

  const cityId = str("cityId");
  const cityOk = cityId ? await prisma.city.findUnique({ where: { id: cityId }, select: { id: true } }) : null;

  try {
    await prisma.doctorProfile.update({
      where: { id: doctor.id },
      data: {
        qualifications: str("qualifications") || doctor.qualifications,
        clinic: str("clinic") || null,
        bioEn: str("bioEn") || doctor.bioEn,
        bioUr: str("bioUr") || null,
        experienceYears: Number.isFinite(years) && years >= 0 ? Math.min(Math.round(years), 70) : doctor.experienceYears,
        consultFeePaisa: feePaisa("consultFee", doctor.consultFeePaisa),
        clinicFeePaisa: feePaisa("clinicFee", doctor.clinicFeePaisa),
        languages: languages.length ? languages : doctor.languages,
        modes: modes.length ? modes : doctor.modes,
        active: formData.get("active") === "on",
        ...(cityOk ? { cityId: cityOk.id } : {}),
      },
    });
  } catch {
    redirect("/doctor/public-profile?saved=err");
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "doctor.profile_updated",
      targetType: "DoctorProfile",
      targetId: doctor.id,
    },
  });

  revalidatePath("/doctor/public-profile");
  revalidatePath(`/doctor/${doctor.slug}`);
  redirect("/doctor/public-profile?saved=1");
}
