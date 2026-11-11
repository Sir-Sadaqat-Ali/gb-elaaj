import { prisma } from "@/lib/db";
import { ConsultMode, SlotStatus } from "@prisma/client";

/**
 * Standard fixed daily operating hours:
 * 10:00 AM to 5:00 PM in exact 20-minute intervals.
 */
export const DAILY_SLOT_TIMES: { hour: number; minute: number }[] = [
  { hour: 10, minute: 0 },
  { hour: 10, minute: 20 },
  { hour: 10, minute: 40 },
  { hour: 11, minute: 0 },
  { hour: 11, minute: 20 },
  { hour: 11, minute: 40 },
  { hour: 12, minute: 0 },
  { hour: 12, minute: 20 },
  { hour: 12, minute: 40 },
  { hour: 13, minute: 0 },
  { hour: 13, minute: 20 },
  { hour: 13, minute: 40 },
  { hour: 14, minute: 0 },
  { hour: 14, minute: 20 },
  { hour: 14, minute: 40 },
  { hour: 15, minute: 0 },
  { hour: 15, minute: 20 },
  { hour: 15, minute: 40 },
  { hour: 16, minute: 0 },
  { hour: 16, minute: 20 },
  { hour: 16, minute: 40 },
];

/**
 * Ensures a doctor has standard 10:00 AM – 5:00 PM (20-min) slots for a SINGLE day.
 * Does not overwrite existing blocked/booked slots.
 */
export async function ensureDoctorDaySlots(doctorId: string, targetDate: Date = new Date()) {
  const day = new Date(targetDate);
  day.setHours(0, 0, 0, 0);

  const nextDay = new Date(day);
  nextDay.setDate(day.getDate() + 1);

  const existing = await prisma.doctorAvailability.findMany({
    where: {
      doctorId,
      startsAt: { gte: day, lt: nextDay },
    },
    orderBy: { startsAt: "asc" },
  });

  if (existing.length >= 21) {
    return existing;
  }

  const slotsToCreate: {
    doctorId: string;
    startsAt: Date;
    endsAt: Date;
    mode: ConsultMode;
    status: SlotStatus;
  }[] = [];

  for (const { hour, minute } of DAILY_SLOT_TIMES) {
    const startsAt = new Date(day);
    startsAt.setHours(hour, minute, 0, 0);
    const endsAt = new Date(startsAt.getTime() + 20 * 60 * 1000);

    slotsToCreate.push({
      doctorId,
      startsAt,
      endsAt,
      mode: ConsultMode.VIDEO,
      status: SlotStatus.OPEN,
    });
    slotsToCreate.push({
      doctorId,
      startsAt,
      endsAt,
      mode: ConsultMode.CLINIC,
      status: SlotStatus.OPEN,
    });
  }

  if (slotsToCreate.length > 0) {
    try {
      await prisma.doctorAvailability.createMany({
        data: slotsToCreate,
        skipDuplicates: true,
      });
    } catch (e) {
      console.error("[slots] Day slot generation error:", e);
    }
  }

  return prisma.doctorAvailability.findMany({
    where: {
      doctorId,
      startsAt: { gte: day, lt: nextDay },
    },
    orderBy: { startsAt: "asc" },
  });
}

/**
 * For patient booking: ensures upcoming 7 days have bookable open slots.
 */
export async function ensureDoctorUpcomingSlots(doctorId: string, daysAhead: number = 7) {
  const now = new Date();

  for (let d = 0; d < daysAhead; d++) {
    const day = new Date(now);
    day.setDate(now.getDate() + d);
    await ensureDoctorDaySlots(doctorId, day);
  }

  return prisma.doctorAvailability.findMany({
    where: { doctorId, startsAt: { gte: now }, status: SlotStatus.OPEN },
    orderBy: { startsAt: "asc" },
    take: 48,
  });
}
