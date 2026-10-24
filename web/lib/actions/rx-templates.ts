"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/lib/actions/appointments";

const lineSchema = z.object({
  drug: z.string().min(1).max(200),
  strength: z.string().max(100).optional().nullable(),
  frequency: z.string().min(1).max(200),
  durationDays: z.coerce.number().int().min(1).max(365),
  notes: z.string().max(500).optional().nullable(),
});

const templateSchema = z.object({
  name: z.string().min(2).max(80),
  diagnosis: z.string().min(1).max(200),
  notes: z.string().max(2000).optional().nullable(),
  lines: z.array(lineSchema).min(1).max(20),
});

async function requireDoctor() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.DOCTOR) return null;
  const doctor = await prisma.doctorProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  return doctor ? { userId: session.user.id, doctorId: doctor.id } : null;
}

/** Doctor saves the current prescription draft as a reusable template. */
export async function createRxTemplateAction(input: unknown): Promise<ActionResult> {
  const me = await requireDoctor();
  if (!me) return { ok: false, error: "Doctors only." };
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Add a name, diagnosis, and at least one medicine first." };

  try {
    await prisma.prescriptionTemplate.create({
      data: {
        doctorId: me.doctorId,
        name: parsed.data.name.trim(),
        diagnosis: parsed.data.diagnosis,
        notes: parsed.data.notes ?? null,
        lines: parsed.data.lines,
      },
    });
    await prisma.auditLog.create({
      data: { actorUserId: me.userId, action: "rx_template.created", targetType: "DoctorProfile", targetId: me.doctorId },
    });
    revalidatePath("/doctor/prescriptions");
    return { ok: true };
  } catch {
    return { ok: false, error: "Templates aren't available yet — please try again later." };
  }
}

/** Doctor deletes one of their own templates. */
export async function deleteRxTemplateAction(input: { id: string }): Promise<ActionResult> {
  const me = await requireDoctor();
  if (!me) return { ok: false, error: "Doctors only." };
  try {
    const tpl = await prisma.prescriptionTemplate.findUnique({ where: { id: input.id }, select: { id: true, doctorId: true } });
    if (!tpl || tpl.doctorId !== me.doctorId) return { ok: false, error: "Not allowed." };

    await prisma.prescriptionTemplate.delete({ where: { id: tpl.id } });
    revalidatePath("/doctor/prescriptions");
    return { ok: true };
  } catch {
    return { ok: false, error: "Templates aren't available yet — please try again later." };
  }
}
