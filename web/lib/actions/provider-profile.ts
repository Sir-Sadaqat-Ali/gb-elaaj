"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

async function validCityId(cityId: string): Promise<string | null> {
  if (!cityId) return null;
  const city = await prisma.city.findUnique({ where: { id: cityId }, select: { id: true } });
  return city?.id ?? null;
}

/**
 * Lab / pharmacy owners edit their storefront. Identity + verification fields
 * (slug, license, verified) stay locked — only display name, city, and the
 * "accepting work" toggle are self-editable.
 */
export async function updateLabProfileAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.LAB_ADMIN) return;
  const lab = await prisma.lab.findUnique({ where: { ownerUserId: session.user.id } });
  if (!lab) return;

  const name = String(formData.get("name") ?? "").trim();
  const cityId = await validCityId(String(formData.get("cityId") ?? "").trim());

  try {
    await prisma.lab.update({
      where: { id: lab.id },
      data: { name: name || lab.name, active: formData.get("active") === "on", ...(cityId ? { cityId } : {}) },
    });
  } catch {
    redirect("/lab-admin/settings?saved=err");
  }
  await prisma.auditLog.create({
    data: { actorUserId: session.user.id, action: "lab.profile_updated", targetType: "Lab", targetId: lab.id },
  });
  revalidatePath("/lab-admin/settings");
  redirect("/lab-admin/settings?saved=1");
}

export async function updatePharmacyProfileAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.PHARMACY_ADMIN) return;
  const pharm = await prisma.pharmacy.findUnique({ where: { ownerUserId: session.user.id } });
  if (!pharm) return;

  const name = String(formData.get("name") ?? "").trim();
  const cityId = await validCityId(String(formData.get("cityId") ?? "").trim());

  try {
    await prisma.pharmacy.update({
      where: { id: pharm.id },
      data: { name: name || pharm.name, active: formData.get("active") === "on", ...(cityId ? { cityId } : {}) },
    });
  } catch {
    redirect("/pharmacy-admin/settings?saved=err");
  }
  await prisma.auditLog.create({
    data: { actorUserId: session.user.id, action: "pharmacy.profile_updated", targetType: "Pharmacy", targetId: pharm.id },
  });
  revalidatePath("/pharmacy-admin/settings");
  redirect("/pharmacy-admin/settings?saved=1");
}
