"use server";

import { revalidatePath } from "next/cache";
import { Role, SlotStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { doctorScheduleSchema } from "@/lib/validation/booking";
import type { ActionResult } from "@/lib/actions/appointments";

export async function generateScheduleAction(input: {
  startDate: string;
  days: number;
  startHour: number;
  endHour: number;
  slotMinutes: number;
  mode: "VIDEO" | "CLINIC";
}): Promise<ActionResult<{ created: number }>> {
  const parsed = doctorScheduleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const session = await auth();
  if (!session?.user || session.user.role !== Role.DOCTOR) {
    return { ok: false, error: "Only doctors can edit their schedule." };
  }
  const doctor = await prisma.doctorProfile.findUnique({ where: { userId: session.user.id } });
  if (!doctor) return { ok: false, error: "Doctor profile not found." };

  const { startDate, days, startHour, endHour, slotMinutes, mode } = parsed.data;
  if (endHour <= startHour) return { ok: false, error: "End hour must be after start hour." };

  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return { ok: false, error: "Invalid start date." };

  const slotMs = slotMinutes * 60_000;
  const slotsToCreate: { startsAt: Date; endsAt: Date }[] = [];

  for (let d = 0; d < days; d++) {
    const day = new Date(start);
    day.setDate(start.getDate() + d);
    const dayStart = new Date(day);
    dayStart.setHours(startHour, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(endHour, 0, 0, 0);
    for (let t = dayStart.getTime(); t + slotMs <= dayEnd.getTime(); t += slotMs) {
      slotsToCreate.push({
        startsAt: new Date(t),
        endsAt: new Date(t + slotMs),
      });
    }
  }

  // Insert; skip duplicates via the unique [doctorId, startsAt, mode]
  let created = 0;
  for (const s of slotsToCreate) {
    try {
      await prisma.doctorAvailability.create({
        data: { doctorId: doctor.id, startsAt: s.startsAt, endsAt: s.endsAt, mode, status: SlotStatus.OPEN },
      });
      created++;
    } catch {
      // duplicate slot — ignore
    }
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "schedule.generated",
      targetType: "DoctorProfile",
      targetId: doctor.id,
      meta: { startDate, days, slotMinutes, mode, created },
    },
  });

  revalidatePath("/doctor/time-slots");
  revalidatePath("/doctor/schedule");
  return { ok: true, data: { created } };
}

export async function blockSlotAction(input: { slotId: string }): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.DOCTOR) return { ok: false, error: "Not allowed." };
  const slot = await prisma.doctorAvailability.findUnique({
    where: { id: input.slotId },
    include: { doctor: true },
  });
  if (!slot) return { ok: false, error: "Slot not found." };
  if (slot.doctor.userId !== session.user.id) return { ok: false, error: "Not allowed." };
  if (slot.status === "BOOKED") return { ok: false, error: "Slot is booked." };
  await prisma.doctorAvailability.update({
    where: { id: slot.id },
    data: { status: slot.status === "BLOCKED" ? "OPEN" : "BLOCKED" },
  });
  revalidatePath("/doctor/time-slots");
  revalidatePath("/doctor/schedule");
  return { ok: true };
}
