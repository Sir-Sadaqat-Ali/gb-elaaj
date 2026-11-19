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

export async function toggleDayOffAction(input: {
  dateIso: string;
  markOff: boolean;
}): Promise<ActionResult<{ updated: number }>> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.DOCTOR) {
    return { ok: false, error: "Only doctors can update their leave." };
  }
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!doctor) return { ok: false, error: "Doctor profile not found." };

  const [y, m, d] = input.dateIso.split("-").map(Number);
  // UTC bounds covering the full day in PKT (UTC+5)
  const startOfDay = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));

  const res = await prisma.doctorAvailability.updateMany({
    where: {
      doctorId: doctor.id,
      startsAt: { gte: startOfDay, lte: endOfDay },
      status: input.markOff ? SlotStatus.OPEN : SlotStatus.BLOCKED,
    },
    data: {
      status: input.markOff ? SlotStatus.BLOCKED : SlotStatus.OPEN,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: input.markOff ? "schedule.day_off_marked" : "schedule.day_off_cleared",
      targetType: "DoctorProfile",
      targetId: doctor.id,
      meta: { dateIso: input.dateIso, updated: res.count },
    },
  });

  revalidatePath("/doctor/schedule");
  revalidatePath("/doctors");
  return { ok: true, data: { updated: res.count } };
}

export async function toggleShiftAction(input: {
  dateIso: string;
  shift: "MORNING" | "EVENING" | "NIGHT" | "ALL";
  markOpen: boolean;
}): Promise<ActionResult<{ updated: number }>> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.DOCTOR) {
    return { ok: false, error: "Only doctors can update their shift." };
  }
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!doctor) return { ok: false, error: "Doctor profile not found." };

  const [y, m, d] = input.dateIso.split("-").map(Number);
  let startUtc: Date;
  let endUtc: Date;

  if (input.shift === "MORNING") {
    // 08:00 PKT to 15:59:59 PKT (03:00 UTC to 10:59:59 UTC)
    startUtc = new Date(Date.UTC(y, m - 1, d, 3, 0, 0, 0));
    endUtc = new Date(Date.UTC(y, m - 1, d, 10, 59, 59, 999));
  } else if (input.shift === "EVENING") {
    // 16:00 PKT to 23:59:59 PKT (11:00 UTC to 18:59:59 UTC)
    startUtc = new Date(Date.UTC(y, m - 1, d, 11, 0, 0, 0));
    endUtc = new Date(Date.UTC(y, m - 1, d, 18, 59, 59, 999));
  } else if (input.shift === "NIGHT") {
    // 00:00 PKT to 07:59:59 PKT (-5 to 2:59 UTC)
    startUtc = new Date(Date.UTC(y, m - 1, d, -5, 0, 0, 0));
    endUtc = new Date(Date.UTC(y, m - 1, d, 2, 59, 59, 999));
  } else {
    // ALL 24 hours (-5 to 18:59 UTC)
    startUtc = new Date(Date.UTC(y, m - 1, d, -5, 0, 0, 0));
    endUtc = new Date(Date.UTC(y, m - 1, d, 18, 59, 59, 999));
  }

  const res = await prisma.doctorAvailability.updateMany({
    where: {
      doctorId: doctor.id,
      startsAt: { gte: startUtc, lte: endUtc },
      status: input.markOpen ? SlotStatus.BLOCKED : SlotStatus.OPEN,
    },
    data: {
      status: input.markOpen ? SlotStatus.OPEN : SlotStatus.BLOCKED,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: input.markOpen ? "schedule.shift_activated" : "schedule.shift_blocked",
      targetType: "DoctorProfile",
      targetId: doctor.id,
      meta: { dateIso: input.dateIso, shift: input.shift, updated: res.count },
    },
  });

  revalidatePath("/doctor/schedule");
  revalidatePath(`/doctor/${doctor.slug}`);
  return { ok: true, data: { updated: res.count } };
}

export async function setDoctorActiveShiftAction(input: {
  dateIso: string;
  shift: "MORNING" | "EVENING" | "NIGHT" | "ALL" | "NONE";
}): Promise<ActionResult<{ activeShift: string }>> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.DOCTOR) {
    return { ok: false, error: "Only doctors can update their active shift." };
  }
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!doctor) return { ok: false, error: "Doctor profile not found." };

  const [y, m, d] = input.dateIso.split("-").map(Number);
  const dayStartUtc = new Date(Date.UTC(y, m - 1, d, -5, 0, 0, 0));
  const dayEndUtc = new Date(Date.UTC(y, m - 1, d, 18, 59, 59, 999));

  // Night: 00:00 to 07:59 PKT (-5 to 2:59 UTC)
  const nightStart = new Date(Date.UTC(y, m - 1, d, -5, 0, 0, 0));
  const nightEnd = new Date(Date.UTC(y, m - 1, d, 2, 59, 59, 999));

  // Morning: 08:00 to 15:59 PKT (3 to 10:59 UTC)
  const morningStart = new Date(Date.UTC(y, m - 1, d, 3, 0, 0, 0));
  const morningEnd = new Date(Date.UTC(y, m - 1, d, 10, 59, 59, 999));

  // Evening: 16:00 to 23:59 PKT (11 to 18:59 UTC)
  const eveningStart = new Date(Date.UTC(y, m - 1, d, 11, 0, 0, 0));
  const eveningEnd = new Date(Date.UTC(y, m - 1, d, 18, 59, 59, 999));

  if (input.shift === "ALL") {
    // Open all non-booked slots
    await prisma.doctorAvailability.updateMany({
      where: {
        doctorId: doctor.id,
        startsAt: { gte: dayStartUtc, lte: dayEndUtc },
        status: SlotStatus.BLOCKED,
      },
      data: { status: SlotStatus.OPEN },
    });
  } else if (input.shift === "NONE") {
    // Disable all non-booked slots (Day Off)
    await prisma.doctorAvailability.updateMany({
      where: {
        doctorId: doctor.id,
        startsAt: { gte: dayStartUtc, lte: dayEndUtc },
        status: SlotStatus.OPEN,
      },
      data: { status: SlotStatus.BLOCKED },
    });
  } else {
    let activeRange: { start: Date; end: Date };
    if (input.shift === "MORNING") activeRange = { start: morningStart, end: morningEnd };
    else if (input.shift === "EVENING") activeRange = { start: eveningStart, end: eveningEnd };
    else activeRange = { start: nightStart, end: nightEnd };

    // 1) Open the selected shift's slots
    await prisma.doctorAvailability.updateMany({
      where: {
        doctorId: doctor.id,
        startsAt: { gte: activeRange.start, lte: activeRange.end },
        status: SlotStatus.BLOCKED,
      },
      data: { status: SlotStatus.OPEN },
    });

    // 2) Disable the other two shifts' non-booked slots
    await prisma.doctorAvailability.updateMany({
      where: {
        doctorId: doctor.id,
        startsAt: { gte: dayStartUtc, lte: dayEndUtc },
        NOT: { startsAt: { gte: activeRange.start, lte: activeRange.end } },
        status: SlotStatus.OPEN,
      },
      data: { status: SlotStatus.BLOCKED },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "schedule.shift_rotation_set",
      targetType: "DoctorProfile",
      targetId: doctor.id,
      meta: { dateIso: input.dateIso, shift: input.shift },
    },
  });

  revalidatePath("/doctor/schedule");
  revalidatePath(`/doctor/${doctor.slug}`);
  revalidatePath("/doctors");
  return { ok: true, data: { activeShift: input.shift } };
}
