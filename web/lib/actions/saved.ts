"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

type ToggleResult = { ok: true; saved: boolean } | { ok: false; error: string };

/** Patient saves / unsaves a doctor (toggle). */
export async function toggleSavedDoctorAction(input: { doctorId: string }): Promise<ToggleResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.PATIENT) return { ok: false, error: "Sign in as a patient." };
  const me = await prisma.patientProfile.findUnique({ where: { userId: session.user.id } });
  if (!me) return { ok: false, error: "Patient profile not found." };

  const doctor = await prisma.doctorProfile.findUnique({ where: { id: input.doctorId }, select: { id: true } });
  if (!doctor) return { ok: false, error: "Doctor not found." };

  try {
    const existing = await prisma.savedDoctor.findUnique({
      where: { patientId_doctorId: { patientId: me.id, doctorId: doctor.id } },
    });

    let saved: boolean;
    if (existing) {
      await prisma.savedDoctor.delete({ where: { id: existing.id } });
      saved = false;
    } else {
      await prisma.savedDoctor.create({ data: { patientId: me.id, doctorId: doctor.id } });
      saved = true;
    }

    revalidatePath("/patient/saved");
    return { ok: true, saved };
  } catch {
    // SavedDoctor table may not be migrated yet.
    return { ok: false, error: "Saving doctors isn't available yet — please try again later." };
  }
}
