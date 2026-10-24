"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, MedicalRecordType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { prescriptionSchema, type PrescriptionInput } from "@/lib/validation/booking";
import type { ActionResult } from "@/lib/actions/appointments";

export async function createPrescriptionAction(input: PrescriptionInput): Promise<ActionResult<{ recordId: string }>> {
  const parsed = prescriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fill in all fields." };
  const session = await auth();
  if (!session?.user || session.user.role !== Role.DOCTOR) return { ok: false, error: "Only doctors can issue prescriptions." };
  const doctor = await prisma.doctorProfile.findUnique({ where: { userId: session.user.id } });
  if (!doctor) return { ok: false, error: "Doctor profile not found." };

  const appt = await prisma.appointment.findUnique({ where: { id: parsed.data.appointmentId }, include: { patient: true } });
  if (!appt || appt.doctorId !== doctor.id) return { ok: false, error: "Not allowed for this appointment." };

  const record = await prisma.medicalRecord.create({
    data: {
      patientId: appt.patientId,
      doctorId: doctor.id,
      appointmentId: appt.id,
      type: MedicalRecordType.PRESCRIPTION,
      title: `Prescription · ${parsed.data.diagnosis}`,
      body: parsed.data.notes ?? "",
      data: {
        diagnosis: parsed.data.diagnosis,
        notes: parsed.data.notes,
        lines: parsed.data.lines,
      },
      recordedAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: appt.patient.userId,
      title: "New prescription",
      body: `Dr. ${session.user.name?.replace(/^Dr\.?\s*/i, "")} has shared a prescription with you.`,
      href: `/patient/medical-records`,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "rx.created",
      targetType: "MedicalRecord",
      targetId: record.id,
      meta: { appointmentId: appt.id, lines: parsed.data.lines.length },
    },
  });

  revalidatePath(`/doctor/appointments`);
  revalidatePath(`/doctor/prescriptions`);
  revalidatePath(`/patient/medical-records`);
  redirect(`/doctor/appointments`);
}

/**
 * A doctor saves a free-text consultation note (no Rx) against an appointment.
 * Stored as a NOTE medical record, visible to the patient and in the doctor's
 * per-patient history.
 */
export async function createConsultationNoteAction(input: { appointmentId: string; note: string }): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.DOCTOR) return { ok: false, error: "Only doctors can add notes." };

  const note = (input.note ?? "").trim();
  if (note.length < 3) return { ok: false, error: "Note is too short." };
  if (note.length > 5000) return { ok: false, error: "Note is too long (max 5000 characters)." };

  const doctor = await prisma.doctorProfile.findUnique({ where: { userId: session.user.id } });
  if (!doctor) return { ok: false, error: "Doctor profile not found." };

  const appt = await prisma.appointment.findUnique({ where: { id: input.appointmentId }, include: { patient: true } });
  if (!appt || appt.doctorId !== doctor.id) return { ok: false, error: "Not allowed for this appointment." };

  const record = await prisma.medicalRecord.create({
    data: {
      patientId: appt.patientId,
      doctorId: doctor.id,
      appointmentId: appt.id,
      type: MedicalRecordType.NOTE,
      title: "Consultation note",
      body: note,
      recordedAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: appt.patient.userId,
      title: "New consultation note",
      body: "Your doctor added a note from your consultation.",
      href: "/patient/medical-records",
    },
  });
  await prisma.auditLog.create({
    data: { actorUserId: session.user.id, action: "note.created", targetType: "MedicalRecord", targetId: record.id, meta: { appointmentId: appt.id } },
  });

  revalidatePath("/patient/medical-records");
  revalidatePath(`/doctor/patients/${appt.patientId}`);
  return { ok: true };
}
