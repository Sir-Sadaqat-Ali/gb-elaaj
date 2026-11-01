"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, AppointmentStatus, SlotStatus, TransactionKind, TransactionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { calcCommission } from "@/lib/commission";
import { sendEmailFor } from "@/lib/notifications/send-email";
import { formatPkr } from "@/lib/formatting";
import {
  bookAppointmentSchema,
  cancelAppointmentSchema,
  completeAppointmentSchema,
  rescheduleAppointmentSchema,
  type BookAppointmentInput,
} from "@/lib/validation/booking";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

// ── Book ─────────────────────────────────────────────────────
export async function bookAppointmentAction(input: BookAppointmentInput): Promise<ActionResult<{ appointmentId: string }>> {
  const parsed = bookAppointmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const session = await auth();
  if (!session?.user) return { ok: false, error: "Please sign in to book." };
  if (session.user.role !== Role.PATIENT) return { ok: false, error: "Only patients can book." };

  const patient = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { emailVerified: true } } },
  });
  if (!patient) return { ok: false, error: "Patient profile not found." };

  const doctor = await prisma.doctorProfile.findUnique({
    where: { slug: parsed.data.doctorSlug },
    include: { user: true },
  });
  if (!doctor || !doctor.active || doctor.verifiedStatus !== "APPROVED") {
    return { ok: false, error: "Doctor not available." };
  }

  let appointmentId = "";
  let bookedSummary: { when: Date; mode: string; fee: number } | null = null;
  try {
    appointmentId = await prisma.$transaction(async (tx) => {
      const slot = await tx.doctorAvailability.findUnique({ where: { id: parsed.data.slotId } });
      if (!slot || slot.doctorId !== doctor.id) throw new Error("SLOT_NOT_FOUND");
      if (slot.status !== SlotStatus.OPEN) throw new Error("SLOT_TAKEN");
      if (slot.startsAt.getTime() < Date.now()) throw new Error("SLOT_PAST");

      // Lock the slot
      await tx.doctorAvailability.update({
        where: { id: slot.id },
        data: { status: SlotStatus.BOOKED },
      });

      const fee = slot.mode === "VIDEO" ? doctor.consultFeePaisa : doctor.clinicFeePaisa || doctor.consultFeePaisa;
      bookedSummary = { when: slot.startsAt, mode: slot.mode, fee };
      const appt = await tx.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          slotId: slot.id,
          mode: slot.mode,
          status: AppointmentStatus.CONFIRMED,
          feePaisa: fee,
          symptoms: parsed.data.symptoms,
          scheduledFor: slot.startsAt,
          durationMin: Math.max(10, Math.round((slot.endsAt.getTime() - slot.startsAt.getTime()) / 60_000)),
          videoRoomId: null, // populated immediately below
        },
      });

      // Set the Agora channel name based on the created appointment id.
      // Channel naming convention: `appt-<cuid>` — globally unique, ≤32 chars.
      if (slot.mode === "VIDEO") {
        await tx.appointment.update({
          where: { id: appt.id },
          data: { videoRoomId: `appt-${appt.id}` },
        });
      }

      // Compute commission and write a Transaction (placeholder payment)
      const commission = await calcCommission(fee, TransactionKind.CONSULTATION);
      await tx.transaction.create({
        data: {
          kind: TransactionKind.CONSULTATION,
          status: TransactionStatus.SUCCEEDED,
          grossPaisa: commission.grossPaisa,
          commissionPaisa: commission.commissionPaisa,
          netPaisa: commission.netPaisa,
          provider: parsed.data.paymentMethod,
          payerUserId: session.user.id,
          providerRole: Role.DOCTOR,
          providerId: doctor.id,
          appointmentId: appt.id,
          capturedAt: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          userId: doctor.userId,
          title: "New appointment confirmed",
          body: `${session.user.name ?? "A patient"} booked you for ${slot.startsAt.toLocaleString()}.`,
          href: `/doctor/appointments`,
        },
      });
      await tx.notification.create({
        data: {
          userId: session.user.id,
          title: "Appointment confirmed",
          body: `Your ${slot.mode === "VIDEO" ? "video" : "clinic"} consultation with ${doctor.user.name} is confirmed.`,
          href: `/patient/appointments`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "appointment.booked",
          targetType: "Appointment",
          targetId: appt.id,
          meta: { doctorId: doctor.id, slotId: slot.id },
        },
      });

      return appt.id;
    });
  } catch (e: unknown) {
    const code = e instanceof Error ? e.message : "UNKNOWN";
    if (code === "SLOT_TAKEN") return { ok: false, error: "That slot was just taken. Pick another one." };
    if (code === "SLOT_PAST") return { ok: false, error: "Slot is in the past." };
    if (code === "SLOT_NOT_FOUND") return { ok: false, error: "Slot not found." };
    return { ok: false, error: "Something went wrong booking the appointment." };
  }

  // Email confirmation to the patient (in addition to the in-app row).
  if (bookedSummary) {
    const summary = bookedSummary as { when: Date; mode: string; fee: number };
    await sendEmailFor({
      userId: session.user.id,
      template: "appointment.confirmed",
      data: {
        doctorName: doctor.user.name,
        when: summary.when.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }),
        mode: summary.mode === "VIDEO" ? "Video consultation" : "Clinic visit",
        feeText: formatPkr(summary.fee),
        appointmentId,
      },
    });
  }

  revalidatePath("/patient/appointments");
  revalidatePath("/patient/dashboard");
  revalidatePath("/doctor/appointments");
  revalidatePath("/doctor/dashboard");
  redirect(`/patient/appointments/${appointmentId}?booked=1`);
}

// ── Cancel ───────────────────────────────────────────────────
export async function cancelAppointmentAction(input: { appointmentId: string; reason?: string }): Promise<ActionResult> {
  const parsed = cancelAppointmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const session = await auth();
  if (!session?.user) return { ok: false, error: "Please sign in." };

  const appt = await prisma.appointment.findUnique({
    where: { id: parsed.data.appointmentId },
    include: { patient: true, doctor: true, transaction: true },
  });
  if (!appt) return { ok: false, error: "Appointment not found." };
  if (appt.status === "CANCELLED" || appt.status === "COMPLETED") {
    return { ok: false, error: "Appointment cannot be cancelled." };
  }

  // Auth: patient owner, doctor of record, or admin
  const allowed =
    (session.user.role === Role.PATIENT && appt.patient.userId === session.user.id) ||
    (session.user.role === Role.DOCTOR && appt.doctor.userId === session.user.id) ||
    session.user.role === Role.ADMIN;
  if (!allowed) return { ok: false, error: "Not allowed." };

  await prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: appt.id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelReason: parsed.data.reason ?? null,
      },
    });
    if (appt.slotId) {
      await tx.doctorAvailability.update({
        where: { id: appt.slotId },
        data: { status: SlotStatus.OPEN },
      });
    }
    if (appt.transaction) {
      // Mark refund (Phase 3 finance approves; for now we record).
      await tx.transaction.update({
        where: { id: appt.transaction.id },
        data: { status: TransactionStatus.REFUNDED },
      });
    }
    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "appointment.cancelled",
        targetType: "Appointment",
        targetId: appt.id,
        meta: { reason: parsed.data.reason ?? null },
      },
    });
  });

  revalidatePath("/patient/appointments");
  revalidatePath("/patient/dashboard");
  revalidatePath("/doctor/appointments");
  revalidatePath("/doctor/dashboard");
  return { ok: true };
}

// ── Reschedule ──────────────────────────────────────────────
export async function rescheduleAppointmentAction(input: { appointmentId: string; newSlotId: string }): Promise<ActionResult> {
  const parsed = rescheduleAppointmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const session = await auth();
  if (!session?.user) return { ok: false, error: "Please sign in." };

  try {
    await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.findUnique({
        where: { id: parsed.data.appointmentId },
        include: { patient: true, doctor: true },
      });
      if (!appt) throw new Error("APPT_NOT_FOUND");
      if (appt.status === "CANCELLED" || appt.status === "COMPLETED") throw new Error("APPT_LOCKED");

      const allowed =
        (session.user.role === Role.PATIENT && appt.patient.userId === session.user.id) ||
        (session.user.role === Role.DOCTOR && appt.doctor.userId === session.user.id) ||
        session.user.role === Role.ADMIN;
      if (!allowed) throw new Error("NOT_ALLOWED");

      const newSlot = await tx.doctorAvailability.findUnique({ where: { id: parsed.data.newSlotId } });
      if (!newSlot || newSlot.doctorId !== appt.doctorId) throw new Error("SLOT_NOT_FOUND");
      if (newSlot.status !== SlotStatus.OPEN) throw new Error("SLOT_TAKEN");
      if (newSlot.startsAt.getTime() < Date.now()) throw new Error("SLOT_PAST");

      // Free old, lock new, point appointment at new slot
      if (appt.slotId) {
        await tx.doctorAvailability.update({
          where: { id: appt.slotId },
          data: { status: SlotStatus.OPEN },
        });
      }
      await tx.doctorAvailability.update({
        where: { id: newSlot.id },
        data: { status: SlotStatus.BOOKED },
      });
      await tx.appointment.update({
        where: { id: appt.id },
        data: {
          slotId: newSlot.id,
          mode: newSlot.mode,
          scheduledFor: newSlot.startsAt,
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "appointment.rescheduled",
          targetType: "Appointment",
          targetId: appt.id,
          meta: { newSlotId: newSlot.id },
        },
      });
    });
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    return { ok: false, error: code === "SLOT_TAKEN" ? "Slot already taken." : "Could not reschedule." };
  }
  revalidatePath("/patient/appointments");
  revalidatePath("/doctor/appointments");
  return { ok: true };
}

// ── Complete (doctor or admin) ─────────────────────────────
export async function completeAppointmentAction(input: { appointmentId: string }): Promise<ActionResult> {
  const parsed = completeAppointmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Please sign in." };

  const appt = await prisma.appointment.findUnique({
    where: { id: parsed.data.appointmentId },
    include: { doctor: true },
  });
  if (!appt) return { ok: false, error: "Appointment not found." };
  const allowed =
    (session.user.role === Role.DOCTOR && appt.doctor.userId === session.user.id) ||
    session.user.role === Role.ADMIN;
  if (!allowed) return { ok: false, error: "Not allowed." };

  await prisma.appointment.update({
    where: { id: appt.id },
    data: {
      status: AppointmentStatus.COMPLETED,
      startedAt: appt.startedAt ?? new Date(),
      endedAt: new Date(),
    },
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "appointment.completed",
      targetType: "Appointment",
      targetId: appt.id,
    },
  });

  revalidatePath(`/patient/appointments/${appt.id}`);
  revalidatePath("/doctor/appointments");
  return { ok: true };
}

// ── Mark no-show (doctor or admin) ─────────────────────────
export async function markNoShowAction(input: { appointmentId: string }): Promise<ActionResult> {
  const parsed = completeAppointmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Please sign in." };

  const appt = await prisma.appointment.findUnique({
    where: { id: parsed.data.appointmentId },
    include: { doctor: true },
  });
  if (!appt) return { ok: false, error: "Appointment not found." };
  if (appt.status !== AppointmentStatus.CONFIRMED) {
    return { ok: false, error: "Only a confirmed appointment can be marked no-show." };
  }
  const allowed =
    (session.user.role === Role.DOCTOR && appt.doctor.userId === session.user.id) ||
    session.user.role === Role.ADMIN;
  if (!allowed) return { ok: false, error: "Not allowed." };

  await prisma.appointment.update({
    where: { id: appt.id },
    data: { status: AppointmentStatus.NO_SHOW },
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "appointment.no_show",
      targetType: "Appointment",
      targetId: appt.id,
    },
  });

  revalidatePath("/doctor/appointments");
  revalidatePath(`/patient/appointments/${appt.id}`);
  return { ok: true };
}
