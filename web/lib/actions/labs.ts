"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Role,
  LabBookingStatus,
  TransactionKind,
  TransactionStatus,
  MedicalRecordType,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendEmailFor } from "@/lib/notifications/send-email";
import { auth } from "@/lib/auth";
import { calcCommission } from "@/lib/commission";
import {
  bookLabTestSchema,
  updateLabBookingStatusSchema,
  uploadLabReportSchema,
  type BookLabTestInput,
} from "@/lib/validation/commerce";
import type { ActionResult } from "@/lib/actions/appointments";

// ── Patient books a lab test ─────────────────────────────────
export async function bookLabTestAction(input: BookLabTestInput): Promise<ActionResult<{ bookingId: string }>> {
  const parsed = bookLabTestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const session = await auth();
  if (!session?.user || session.user.role !== Role.PATIENT) return { ok: false, error: "Sign in as a patient." };
  const me = await prisma.patientProfile.findUnique({ where: { userId: session.user.id } });
  if (!me) return { ok: false, error: "Patient profile not found." };

  const test = await prisma.labTest.findUnique({ where: { id: parsed.data.testId }, include: { lab: true } });
  if (!test || !test.active) return { ok: false, error: "Test not available." };

  const scheduledFor = new Date(parsed.data.scheduledFor);
  if (Number.isNaN(scheduledFor.getTime()) || scheduledFor.getTime() < Date.now() - 60_000) {
    return { ok: false, error: "Pick a future date/time." };
  }
  if (parsed.data.mode === "HOME" && !test.homeEligible) {
    return { ok: false, error: "Home collection is not available for this test." };
  }

  let bookingId = "";
  await prisma.$transaction(async (tx) => {
    const b = await tx.labBooking.create({
      data: {
        patientId: me.id,
        labId: test.labId,
        testId: test.id,
        status: LabBookingStatus.BOOKED,
        mode: parsed.data.mode,
        scheduledFor,
        addressLine: parsed.data.addressLine ?? null,
        pricePaisa: test.pricePaisa,
      },
    });
    bookingId = b.id;
    const commission = await calcCommission(test.pricePaisa, TransactionKind.LAB);
    await tx.transaction.create({
      data: {
        kind: TransactionKind.LAB,
        status: TransactionStatus.SUCCEEDED,
        grossPaisa: commission.grossPaisa,
        commissionPaisa: commission.commissionPaisa,
        netPaisa: commission.netPaisa,
        provider: parsed.data.paymentMethod,
        payerUserId: session.user.id,
        providerRole: Role.LAB_ADMIN,
        providerId: test.labId,
        labBookingId: b.id,
        capturedAt: new Date(),
      },
    });
    await tx.notification.create({
      data: {
        userId: test.lab.ownerUserId,
        title: "New lab booking",
        body: `${test.nameEn} booking from ${session.user.name ?? "a patient"}.`,
        href: `/lab-admin/bookings`,
      },
    });
    await tx.notification.create({
      data: {
        userId: session.user.id,
        title: "Lab test booked",
        body: `${test.nameEn} on ${scheduledFor.toLocaleString()}.`,
        href: `/patient/lab-tests`,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "lab.booking.created",
        targetType: "LabBooking",
        targetId: b.id,
        meta: { testId: test.id, mode: parsed.data.mode },
      },
    });
  });

  revalidatePath("/patient/lab-tests");
  revalidatePath("/patient/lab-reports");
  revalidatePath("/lab-admin/bookings");
  redirect(`/patient/lab-reports?booked=1`);
}

// ── Lab admin updates booking status ────────────────────────
export async function updateLabBookingStatusAction(input: {
  bookingId: string;
  status: "BOOKED" | "COLLECTED" | "PROCESSING" | "REPORTED" | "CANCELLED";
}): Promise<ActionResult> {
  const parsed = updateLabBookingStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in." };

  const booking = await prisma.labBooking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { lab: true, patient: { include: { user: true } } },
  });
  if (!booking) return { ok: false, error: "Booking not found." };
  const allowed =
    (session.user.role === Role.LAB_ADMIN && booking.lab.ownerUserId === session.user.id) ||
    session.user.role === Role.ADMIN;
  if (!allowed) return { ok: false, error: "Not allowed." };

  await prisma.labBooking.update({
    where: { id: booking.id },
    data: {
      status: parsed.data.status as LabBookingStatus,
      collectedAt: parsed.data.status === "COLLECTED" ? new Date() : booking.collectedAt,
    },
  });
  await prisma.notification.create({
    data: {
      userId: booking.patient.userId,
      title: `Lab status — ${parsed.data.status.toLowerCase()}`,
      body: `Your lab booking is now ${parsed.data.status.toLowerCase()}.`,
      href: `/patient/lab-reports`,
    },
  });

  revalidatePath(`/lab-admin/bookings`);
  revalidatePath(`/lab-admin/bookings/${booking.id}`);
  return { ok: true };
}

// ── Lab admin uploads a report ──────────────────────────────
export async function uploadLabReportAction(input: {
  bookingId: string;
  fileKey?: string;
  fileMime?: "application/pdf" | "image/png" | "image/jpeg" | "image/webp";
  fileSize?: number;
  summary?: string;
  abnormal?: boolean;
  parameters?: { name: string; value: string; unit?: string; range?: string; flag?: "normal" | "low" | "high" | "abnormal" }[];
}): Promise<ActionResult<{ reportId: string }>> {
  const parsed = uploadLabReportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input — please check the file you uploaded." };
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Please sign in." };

  const booking = await prisma.labBooking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { lab: true, test: true, patient: { include: { user: true } }, report: true },
  });
  if (!booking) return { ok: false, error: "Booking not found." };

  const allowed =
    (session.user.role === Role.LAB_ADMIN && booking.lab.ownerUserId === session.user.id) ||
    session.user.role === Role.ADMIN;
  if (!allowed) return { ok: false, error: "You don't have permission to upload reports for this booking." };

  let reportId = "";
  await prisma.$transaction(async (tx) => {
    const report = booking.report
      ? await tx.labReport.update({
          where: { id: booking.report.id },
          data: {
            fileKey: parsed.data.fileKey ?? null,
            fileMime: parsed.data.fileMime ?? null,
            fileSize: parsed.data.fileSize ?? null,
            results: { parameters: parsed.data.parameters ?? [], summary: parsed.data.summary ?? "" },
            abnormal: parsed.data.abnormal ?? false,
            uploadedAt: new Date(),
          },
        })
      : await tx.labReport.create({
          data: {
            bookingId: booking.id,
            fileKey: parsed.data.fileKey ?? null,
            fileMime: parsed.data.fileMime ?? null,
            fileSize: parsed.data.fileSize ?? null,
            results: { parameters: parsed.data.parameters ?? [], summary: parsed.data.summary ?? "" },
            abnormal: parsed.data.abnormal ?? false,
          },
        });
    reportId = report.id;
    await tx.labBooking.update({
      where: { id: booking.id },
      data: { status: LabBookingStatus.REPORTED },
    });
    await tx.medicalRecord.create({
      data: {
        patientId: booking.patientId,
        type: MedicalRecordType.LAB_REPORT,
        title: `${booking.test.nameEn} — ${booking.lab.name}`,
        body: parsed.data.summary ?? "",
        data: { abnormal: parsed.data.abnormal ?? false, parameters: parsed.data.parameters ?? [] },
        fileKey: parsed.data.fileKey ?? null,
        fileMime: parsed.data.fileMime ?? null,
        fileSize: parsed.data.fileSize ?? null,
        recordedAt: new Date(),
      },
    });
    await tx.notification.create({
      data: {
        userId: booking.patient.userId,
        title: "Lab report ready",
        body: `${booking.test.nameEn} report from ${booking.lab.name} is now available.`,
        href: `/patient/lab-reports`,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "lab.report.uploaded",
        targetType: "LabReport",
        targetId: report.id,
        meta: { bookingId: booking.id, abnormal: parsed.data.abnormal ?? false },
      },
    });
  });

  // Email the patient that their report is ready (in addition to the in-app row).
  await sendEmailFor({
    userId: booking.patient.userId,
    template: "lab.report.ready",
    data: { testName: booking.test.nameEn, labName: booking.lab.name },
  });

  revalidatePath("/patient/lab-reports");
  revalidatePath("/patient/medical-records");
  revalidatePath(`/lab-admin/bookings`);
  return { ok: true, data: { reportId } };
}

// ── Cancel a lab booking (patient owner or admin) ───────────
export async function cancelLabBookingAction(input: { bookingId: string }): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Please sign in." };

  const booking = await prisma.labBooking.findUnique({
    where: { id: input.bookingId },
    include: { patient: true, transaction: true },
  });
  if (!booking) return { ok: false, error: "Booking not found." };

  const allowed =
    (session.user.role === Role.PATIENT && booking.patient.userId === session.user.id) ||
    session.user.role === Role.ADMIN;
  if (!allowed) return { ok: false, error: "Not allowed." };
  if (booking.status !== LabBookingStatus.BOOKED) {
    return { ok: false, error: "This booking can no longer be cancelled." };
  }
  const actorUserId = session.user.id;

  await prisma.$transaction(async (tx) => {
    await tx.labBooking.update({ where: { id: booking.id }, data: { status: LabBookingStatus.CANCELLED } });
    if (booking.transaction) {
      await tx.transaction.update({ where: { id: booking.transaction.id }, data: { status: TransactionStatus.REFUNDED } });
    }
    await tx.auditLog.create({
      data: { actorUserId, action: "lab_booking.cancelled", targetType: "LabBooking", targetId: booking.id },
    });
  });

  revalidatePath("/patient/lab-reports");
  revalidatePath("/patient/lab-tests");
  revalidatePath("/lab-admin/bookings");
  return { ok: true };
}
