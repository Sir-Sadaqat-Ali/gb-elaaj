import { prisma } from "@/lib/db";
import { ConsultMode, SlotStatus } from "@prisma/client";
import { formatPktDateIso } from "@/lib/formatting";

/**
 * Standard fixed daily operating hours:
 * 10:00 AM to 5:00 PM in exact 20-minute intervals (21 slots total).
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
 * Helper: get hour (0-23) in Pakistan Standard Time (UTC+5, no DST).
 */
export function getPktHour(date: Date): number {
  return (date.getUTCHours() + 5) % 24;
}

/**
 * Helper: get minute (0-59).
 */
export function getPktMinute(date: Date): number {
  return date.getUTCMinutes();
}

/**
 * Check if a slot timestamp is in the past compared to current time.
 */
export function isSlotPast(startsAt: Date | string): boolean {
  const d = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
  return d.getTime() < Date.now();
}

/**
 * Ensures a doctor has all 21 slots (10:00 AM – 5:00 PM PKT) for a SINGLE day.
 * Always returns ALL 21 slots.
 * Does NOT overwrite existing BOOKED or BLOCKED slots.
 * Cleans up any legacy open slots outside 10:00 AM – 5:00 PM.
 */
export async function ensureDoctorDaySlots(doctorId: string, targetDate: Date | string = new Date()) {
  const dateIso = formatPktDateIso(targetDate);
  const [year, month, day] = dateIso.split("-").map(Number);

  // PKT day range in UTC:
  // 00:00:00 PKT = 19:00:00 UTC previous day (-5 hours)
  // 23:59:59.999 PKT = 18:59:59.999 UTC current day
  const pktDayStartUtc = new Date(Date.UTC(year, month - 1, day, -5, 0, 0, 0));
  const pktDayEndUtc = new Date(Date.UTC(year, month - 1, day, 18, 59, 59, 999));

  const existing = await prisma.doctorAvailability.findMany({
    where: {
      doctorId,
      startsAt: { gte: pktDayStartUtc, lte: pktDayEndUtc },
    },
    orderBy: { startsAt: "asc" },
  });

  // Clean up any historical open slots outside 10:00 AM – 5:00 PM PKT
  const invalidSlotIds = existing
    .filter((s) => {
      const h = getPktHour(new Date(s.startsAt));
      return s.status === SlotStatus.OPEN && (h < 10 || h >= 17);
    })
    .map((s) => s.id);

  if (invalidSlotIds.length > 0) {
    try {
      await prisma.doctorAvailability.deleteMany({
        where: { id: { in: invalidSlotIds } },
      });
    } catch (e) {
      console.error("[slots] Error cleaning invalid slots:", e);
    }
  }

  const validExisting = existing.filter((s) => !invalidSlotIds.includes(s.id));

  const slotsToCreate: {
    doctorId: string;
    startsAt: Date;
    endsAt: Date;
    mode: ConsultMode;
    status: SlotStatus;
  }[] = [];

  for (const { hour, minute } of DAILY_SLOT_TIMES) {
    // hour in PKT (10..16) -> UTC hour = hour - 5
    const startsAt = new Date(Date.UTC(year, month - 1, day, hour - 5, minute, 0, 0));
    const endsAt = new Date(startsAt.getTime() + 20 * 60 * 1000);

    // Check if VIDEO slot exists
    const hasVideo = validExisting.some(
      (e) => e.mode === ConsultMode.VIDEO && e.startsAt.getTime() === startsAt.getTime(),
    );
    if (!hasVideo) {
      slotsToCreate.push({
        doctorId,
        startsAt,
        endsAt,
        mode: ConsultMode.VIDEO,
        status: SlotStatus.OPEN,
      });
    }

    // Check if CLINIC slot exists
    const hasClinic = validExisting.some(
      (e) => e.mode === ConsultMode.CLINIC && e.startsAt.getTime() === startsAt.getTime(),
    );
    if (!hasClinic) {
      slotsToCreate.push({
        doctorId,
        startsAt,
        endsAt,
        mode: ConsultMode.CLINIC,
        status: SlotStatus.OPEN,
      });
    }
  }

  if (slotsToCreate.length > 0) {
    try {
      await prisma.doctorAvailability.createMany({
        data: slotsToCreate,
        skipDuplicates: true,
      });
    } catch (e) {
      console.error("[slots] Error creating standard day slots:", e);
    }
  }

  // Fetch all slots for this day strictly within 10:00 AM to 5:00 PM PKT
  const allDaySlots = await prisma.doctorAvailability.findMany({
    where: {
      doctorId,
      startsAt: { gte: pktDayStartUtc, lte: pktDayEndUtc },
    },
    orderBy: { startsAt: "asc" },
  });

  return allDaySlots.filter((s) => {
    const h = getPktHour(new Date(s.startsAt));
    return h >= 10 && h < 17;
  });
}

/**
 * For patient booking: ensures today and tomorrow have all 21 slots generated.
 */
export async function ensureDoctorUpcomingSlots(doctorId: string, daysAhead: number = 2) {
  const now = new Date();
  const dateIso = formatPktDateIso(now);
  const [year, month, day] = dateIso.split("-").map(Number);

  for (let d = 0; d < daysAhead; d++) {
    const target = new Date(Date.UTC(year, month - 1, day + d, 5, 0, 0, 0)); // 10 AM PKT
    await ensureDoctorDaySlots(doctorId, target);
  }

  const pktDayStartUtc = new Date(Date.UTC(year, month - 1, day, -5, 0, 0, 0));
  const pktFutureEndUtc = new Date(Date.UTC(year, month - 1, day + daysAhead, 18, 59, 59, 999));

  const slots = await prisma.doctorAvailability.findMany({
    where: {
      doctorId,
      startsAt: { gte: pktDayStartUtc, lte: pktFutureEndUtc },
    },
    orderBy: { startsAt: "asc" },
  });

  return slots.filter((s) => {
    const h = getPktHour(new Date(s.startsAt));
    return h >= 10 && h < 17;
  });
}
