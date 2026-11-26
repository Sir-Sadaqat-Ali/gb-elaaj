import { prisma } from "@/lib/db";
import { ConsultMode, SlotStatus } from "@prisma/client";
import { formatPktDateIso } from "@/lib/formatting";

export type ShiftCategory = "MORNING" | "EVENING" | "NIGHT";

export interface ShiftMeta {
  key: ShiftCategory;
  nameEn: string;
  nameUr: string;
  badge: string;
  emoji: string;
  timeRange: string;
  startHour: number; // inclusive
  endHour: number;   // exclusive
}

export const SHIFT_DETAILS: Record<ShiftCategory, ShiftMeta> = {
  MORNING: {
    key: "MORNING",
    nameEn: "Morning Shift",
    nameUr: "صبح کی شفٹ",
    badge: "Morning",
    emoji: "🌅",
    timeRange: "08:00 AM – 04:00 PM",
    startHour: 8,
    endHour: 16,
  },
  EVENING: {
    key: "EVENING",
    nameEn: "Evening Shift",
    nameUr: "شام کی شفٹ",
    badge: "Evening",
    emoji: "🌆",
    timeRange: "04:00 PM – 12:00 AM",
    startHour: 16,
    endHour: 24,
  },
  NIGHT: {
    key: "NIGHT",
    nameEn: "Night Shift",
    nameUr: "رات کی شفٹ",
    badge: "Night",
    emoji: "🌙",
    timeRange: "12:00 AM – 08:00 AM",
    startHour: 0,
    endHour: 8,
  },
};

/**
 * Classifies an hour (0-23 in Pakistan Standard Time) into Morning, Evening, or Night shift.
 */
export function getShiftForHour(pktHour: number): ShiftCategory {
  if (pktHour >= 8 && pktHour < 16) return "MORNING";
  if (pktHour >= 16 && pktHour < 24) return "EVENING";
  return "NIGHT"; // 00:00 to 07:59
}

/**
 * Deterministic fallback duty rotation for doctors.
 */
export function getDoctorShift(doctorId: string): ShiftCategory {
  let hash = 0;
  for (let i = 0; i < doctorId.length; i++) {
    hash = (hash * 31 + doctorId.charCodeAt(i)) >>> 0;
  }
  const shiftIndex = hash % 3;
  if (shiftIndex === 0) return "MORNING";
  if (shiftIndex === 1) return "EVENING";
  return "NIGHT";
}

/**
 * Full 24-Hour Schedule in exact 20-minute intervals (72 slots total per day):
 * - 00:00 to 08:00 : Night Shift (24 slots)
 * - 08:00 to 16:00 : Morning Shift (24 slots)
 * - 16:00 to 24:00 : Evening Shift (24 slots)
 */
export const TWENTY_FOUR_HOUR_SLOT_TIMES: { hour: number; minute: number; shift: ShiftCategory }[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 20, 40]) {
    TWENTY_FOUR_HOUR_SLOT_TIMES.push({
      hour: h,
      minute: m,
      shift: getShiftForHour(h),
    });
  }
}

/**
 * Aliased for backwards compatibility with any existing imports.
 */
export const DAILY_SLOT_TIMES = TWENTY_FOUR_HOUR_SLOT_TIMES;

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
 * Ensures a doctor has all 72 slots (24 Hours in 20-min intervals) for a SINGLE day.
 * Default Policy:
 * - By default, ALL 3 shifts (Morning, Evening, Night) are 100% OPEN for every doctor.
 * - Each doctor can choose or customize their daily shift (e.g. today 23rd, tomorrow 24th) from the portal.
 * - If a doctor has not explicitly customized a date, any unbooked legacy-blocked slots are opened up automatically.
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

  // Check if doctor has explicitly saved custom shifts or day-off for this specific date
  let hasDoctorCustomized = false;
  try {
    const customLog = await prisma.auditLog.findFirst({
      where: {
        targetType: "DoctorProfile",
        targetId: doctorId,
        action: { in: ["schedule.shift_rotation_set", "schedule.day_off_marked", "schedule.day_off_cleared"] },
        meta: { path: ["dateIso"], equals: dateIso },
      },
    });
    hasDoctorCustomized = !!customLog;
  } catch {
    try {
      const logs = await prisma.auditLog.findMany({
        where: {
          targetType: "DoctorProfile",
          targetId: doctorId,
          action: { in: ["schedule.shift_rotation_set", "schedule.day_off_marked", "schedule.day_off_cleared"] },
        },
        take: 30,
        orderBy: { createdAt: "desc" },
      });
      hasDoctorCustomized = logs.some((l) => (l.meta as any)?.dateIso === dateIso);
    } catch {
      hasDoctorCustomized = false;
    }
  }

  // If doctor has NOT manually customized this date, ensure all unbooked slots are OPEN by default
  if (!hasDoctorCustomized && existing.length > 0) {
    const unbookedBlockedIds = existing
      .filter((s) => s.status === SlotStatus.BLOCKED)
      .map((s) => s.id);
    if (unbookedBlockedIds.length > 0) {
      try {
        await prisma.doctorAvailability.updateMany({
          where: { id: { in: unbookedBlockedIds } },
          data: { status: SlotStatus.OPEN },
        });
      } catch (e) {
        console.error("[slots] Error updating default open slots:", e);
      }
    }
  }

  const slotsToCreate: {
    doctorId: string;
    startsAt: Date;
    endsAt: Date;
    mode: ConsultMode;
    status: SlotStatus;
  }[] = [];

  for (const { hour, minute } of TWENTY_FOUR_HOUR_SLOT_TIMES) {
    // hour in PKT (0..23) -> UTC hour = hour - 5
    const startsAt = new Date(Date.UTC(year, month - 1, day, hour - 5, minute, 0, 0));
    const endsAt = new Date(startsAt.getTime() + 20 * 60 * 1000);

    // Default is 100% OPEN across Morning, Evening, and Night
    const initialStatus = SlotStatus.OPEN;

    // Check if VIDEO slot exists
    const hasVideo = existing.some(
      (e) => e.mode === ConsultMode.VIDEO && e.startsAt.getTime() === startsAt.getTime(),
    );
    if (!hasVideo) {
      slotsToCreate.push({
        doctorId,
        startsAt,
        endsAt,
        mode: ConsultMode.VIDEO,
        status: initialStatus,
      });
    }

    // Check if CLINIC slot exists
    const hasClinic = existing.some(
      (e) => e.mode === ConsultMode.CLINIC && e.startsAt.getTime() === startsAt.getTime(),
    );
    if (!hasClinic) {
      slotsToCreate.push({
        doctorId,
        startsAt,
        endsAt,
        mode: ConsultMode.CLINIC,
        status: initialStatus,
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
      console.error("[slots] Error creating 24-hour day slots:", e);
    }
  }

  // Fetch all 72 slots for this 24-hour cycle
  return await prisma.doctorAvailability.findMany({
    where: {
      doctorId,
      startsAt: { gte: pktDayStartUtc, lte: pktDayEndUtc },
    },
    orderBy: { startsAt: "asc" },
  });
}

/**
 * For patient booking: ensures upcoming 7 days have all 24-hour slots generated.
 */
export async function ensureDoctorUpcomingSlots(doctorId: string, daysAhead: number = 7) {
  const now = new Date();
  const dateIso = formatPktDateIso(now);
  const [year, month, day] = dateIso.split("-").map(Number);

  for (let d = 0; d < daysAhead; d++) {
    const target = new Date(Date.UTC(year, month - 1, day + d, 5, 0, 0, 0));
    await ensureDoctorDaySlots(doctorId, target);
  }

  const pktDayStartUtc = new Date(Date.UTC(year, month - 1, day, -5, 0, 0, 0));
  const pktFutureEndUtc = new Date(Date.UTC(year, month - 1, day + daysAhead, 18, 59, 59, 999));

  return await prisma.doctorAvailability.findMany({
    where: {
      doctorId,
      startsAt: { gte: pktDayStartUtc, lte: pktFutureEndUtc },
    },
    orderBy: { startsAt: "asc" },
  });
}
