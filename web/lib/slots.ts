import { prisma } from "@/lib/db";
import { ConsultMode, SlotStatus } from "@prisma/client";

/**
 * Ensures a doctor always has upcoming open slots for booking.
 * If slots have expired (e.g. past days from seed), automatically generates
 * open slots for the next 7 days for both Video and Clinic modes.
 */
export async function ensureDoctorUpcomingSlots(doctorId: string) {
  const now = new Date();
  const existing = await prisma.doctorAvailability.findMany({
    where: { doctorId, startsAt: { gte: now }, status: SlotStatus.OPEN },
    orderBy: { startsAt: "asc" },
    take: 36,
  });

  if (existing.length >= 6) {
    return existing;
  }

  const slotsToCreate: {
    doctorId: string;
    startsAt: Date;
    endsAt: Date;
    mode: ConsultMode;
    status: SlotStatus;
  }[] = [];

  for (let d = 0; d < 7; d++) {
    const day = new Date(now);
    day.setDate(now.getDate() + d);

    const times = [
      [10, 0],
      [10, 30],
      [11, 0],
      [11, 30],
      [14, 0],
      [14, 30],
      [15, 0],
      [15, 30],
      [16, 0],
      [16, 30],
    ];

    for (const [hour, minute] of times) {
      const startsAt = new Date(day);
      startsAt.setHours(hour, minute, 0, 0);

      // Only schedule future slots at least 15 min from current time
      if (startsAt.getTime() > now.getTime() + 15 * 60 * 1000) {
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
        skipDuplicates: true,
      });
    } catch (e) {
      console.error("[slots] Auto-generate slots fallback:", e);
    }
  }

  return prisma.doctorAvailability.findMany({
    where: { doctorId, startsAt: { gte: now }, status: SlotStatus.OPEN },
    orderBy: { startsAt: "asc" },
    take: 36,
  });
}
