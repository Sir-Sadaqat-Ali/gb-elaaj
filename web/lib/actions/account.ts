"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Gender, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth, signOut } from "@/lib/auth";

const BCRYPT_COST = 12;

const PROFILE_PHOTO_KEY_RE = /^profile-photo\/([A-Za-z0-9_-]{1,40})\/[A-Za-z0-9_-]{8,40}\.(png|jpg|webp)$/;

/** Save a previously uploaded profile photo for the signed-in user. */
export async function updateProfilePhotoAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const fileKey = String(formData.get("fileKey") ?? "");
  const match = PROFILE_PHOTO_KEY_RE.exec(fileKey);
  if (!match || match[1] !== session.user.id) return;

  await prisma.user.update({
    where: { id: session.user.id },
    // Keep the existing User.image field and use a stable app URL for private R2 files.
    data: { image: `/api/profile-photo?key=${encodeURIComponent(fileKey)}` },
  });
  await prisma.auditLog.create({
    data: { actorUserId: session.user.id, action: "user.profile_photo_updated", targetType: "User", targetId: session.user.id },
  });

  revalidatePath("/patient/settings");
  revalidatePath("/doctor/public-profile");
  revalidatePath("/pharmacy-admin/settings");
  revalidatePath("/lab-admin/settings");
  revalidatePath("/admin/settings");
}

/**
 * Change password while logged in. Role-agnostic — pass `redirectTo` so each
 * role's settings page gets the feedback query params back.
 */
export async function changePasswordAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  const back = String(formData.get("redirectTo") ?? "/patient/settings");
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < 8) redirect(`${back}?pw=short`);
  if (next !== confirm) redirect(`${back}?pw=mismatch`);

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) redirect(`${back}?pw=nopass`);
  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) redirect(`${back}?pw=wrong`);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, BCRYPT_COST) },
  });
  await prisma.auditLog.create({
    data: { actorUserId: user.id, action: "user.password_changed", targetType: "User", targetId: user.id },
  });
  redirect(`${back}?pw=ok`);
}

/** Patient edits their own profile (name/phone + patient fields). */
export async function updatePatientProfileAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.PATIENT) return;
  const userId = session.user.id;

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const addressLine = String(formData.get("addressLine") ?? "").trim();
  const cityId = String(formData.get("cityId") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const bloodType = String(formData.get("bloodType") ?? "").trim();
  const dob = String(formData.get("dob") ?? "").trim();

  let error: string | null = null;
  try {
    await prisma.$transaction(async (tx) => {
      if (name) {
        await tx.user.update({ where: { id: userId }, data: { name, phone: phone || null } });
      }
      await tx.patientProfile.update({
        where: { userId },
        data: {
          addressLine: addressLine || null,
          cityId: cityId || null,
          gender: ["MALE", "FEMALE", "OTHER"].includes(gender) ? (gender as Gender) : null,
          bloodType: bloodType || null,
          dob: dob ? new Date(dob) : null,
        },
      });
    });
  } catch {
    // Most likely a duplicate phone (unique constraint).
    error = "save";
  }

  if (error) redirect("/patient/settings?profile=err");
  await prisma.auditLog.create({
    data: { actorUserId: userId, action: "patient.profile_updated", targetType: "User", targetId: userId },
  });
  revalidatePath("/patient/settings");
  redirect("/patient/settings?profile=ok");
}

/**
 * Patient deletes their own account. On a medical platform a hard delete would
 * cascade-wipe appointments, prescriptions, and payment records that must be
 * retained, so this is a soft delete: verify the password, scrub personal
 * identifiers, and block login (SUSPENDED). Anonymized transactional records
 * remain. Then sign the user out.
 */
export async function deleteMyAccountAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.PATIENT) return;

  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) redirect("/patient/settings?del=nopass");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) redirect("/patient/settings?del=wrong");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { name: "Deleted account", email: null, phone: null, image: null, passwordHash: null, status: "SUSPENDED" },
    }),
    prisma.patientProfile.update({
      where: { userId: user.id },
      data: { dob: null, gender: null, bloodType: null, addressLine: null },
    }),
    prisma.auditLog.create({
      data: { actorUserId: user.id, action: "patient.account_deleted", targetType: "User", targetId: user.id },
    }),
  ]);

  await signOut({ redirectTo: "/?deleted=1" });
}
