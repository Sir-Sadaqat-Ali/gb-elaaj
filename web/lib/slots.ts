import { prisma } from "@/lib/db";
import { ConsultMode, SlotStatus } from "@prisma/client";

/**
 * Standard fixed daily operating hours:
 * 10:00 AM to 5:00 PM in exact 20-minute slots.
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
 * Ensures a doctor always has upcoming rolling 7-day slots (10:00 AM – 5:00 PM, 20 mins each).
 * Respects existing slots: does NOT overwrite BLOCKED or BOOKED slots.
 */
export async function ensureDoctorUpcomingSlots(doctorId: string, daysAhead: number = 7) {
  const now = new Date();

  // Create missing standard slots for today and upcoming days
  const slotsToCreate: {
    doctorId: string;
    startsAt: Date;
    endsAt: Date;
    mode: ConsultMode;
    status: SlotStatus;
  }[] = [];

  for (let d = 0; d < daysAhead; d++) {
    const day = new Date(now);
    day.setDate(now.getDate() + d);

    for (const { hour, minute } of DAILY_SLOT_TIMES) {
      const startsAt = new Date(day);
      startsAt.setHours(hour, minute, 0, 0);

      // Only schedule slots that haven't passed
      if (startsAt.getTime() > now.getTime() + 10 * 60 * 1000) {
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
    }
  }

  if (slotsToCreate.length > 0) {
    try {
      await prisma.doctorAvailability.createMany({
        data: slotsToCreate,
        skipDuplicates: true, // keeps existing BLOCKED/BOOKED slots safe!
      });
    } catch (e) {
      console.error("[slots] Auto-generation error:", e);
    }
  }

  return prisma.doctorAvailability.findMany({
    where: { doctorId, startsAt: { gte: now } },
    orderBy: { startsAt: "asc" },
  });
}
