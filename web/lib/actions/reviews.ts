"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { reviewSchema, type ReviewInput } from "@/lib/validation/booking";
import type { ActionResult } from "@/lib/actions/appointments";

export async function createReviewAction(input: ReviewInput): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const session = await auth();
  if (!session?.user || session.user.role !== Role.PATIENT) return { ok: false, error: "Only patients can review." };
  const me = await prisma.patientProfile.findUnique({ where: { userId: session.user.id } });
  if (!me) return { ok: false, error: "Patient profile not found." };

  const appt = await prisma.appointment.findUnique({ where: { id: parsed.data.appointmentId }, include: { review: true } });
  if (!appt || appt.patientId !== me.id) return { ok: false, error: "Not allowed." };
  if (appt.status !== "COMPLETED") return { ok: false, error: "Reviews are only allowed after completion." };
  if (appt.review) return { ok: false, error: "Already reviewed." };

  await prisma.$transaction(async (tx) => {
    await tx.review.create({
      data: {
        appointmentId: appt.id,
        patientId: me.id,
        doctorId: appt.doctorId,
        authorUserId: session.user.id,
        rating: parsed.data.rating,
        text: parsed.data.text,
      },
    });
    // Recompute doctor rating average
    const agg = await tx.review.aggregate({
      where: { doctorId: appt.doctorId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await tx.doctorProfile.update({
      where: { id: appt.doctorId },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count._all,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "review.created",
        targetType: "Appointment",
        targetId: appt.id,
        meta: { rating: parsed.data.rating },
      },
    });
  });

  revalidatePath(`/doctor/${appt.doctorId}`);
  revalidatePath(`/patient/appointments/${appt.id}`);
  redirect(`/patient/appointments/${appt.id}`);
}

/** Patient edits their own review; doctor rating average is recomputed. */
export async function updateReviewAction(input: ReviewInput): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const session = await auth();
  if (!session?.user || session.user.role !== Role.PATIENT) return { ok: false, error: "Only patients can review." };
  const me = await prisma.patientProfile.findUnique({ where: { userId: session.user.id } });
  if (!me) return { ok: false, error: "Patient profile not found." };

  const appt = await prisma.appointment.findUnique({ where: { id: parsed.data.appointmentId }, include: { review: true } });
  if (!appt || appt.patientId !== me.id || !appt.review) return { ok: false, error: "Not allowed." };
  if (appt.review.authorUserId !== session.user.id) return { ok: false, error: "Not allowed." };

  const reviewId = appt.review.id;
  await prisma.$transaction(async (tx) => {
    await tx.review.update({ where: { id: reviewId }, data: { rating: parsed.data.rating, text: parsed.data.text } });
    const agg = await tx.review.aggregate({ where: { doctorId: appt.doctorId }, _avg: { rating: true }, _count: { _all: true } });
    await tx.doctorProfile.update({ where: { id: appt.doctorId }, data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count._all } });
    await tx.auditLog.create({
      data: { actorUserId: session.user.id, action: "review.updated", targetType: "Appointment", targetId: appt.id, meta: { rating: parsed.data.rating } },
    });
  });

  revalidatePath(`/doctor/${appt.doctorId}`);
  revalidatePath(`/patient/appointments/${appt.id}`);
  redirect(`/patient/appointments/${appt.id}`);
}

/** Patient deletes their own review; doctor rating average is recomputed. */
export async function deleteReviewAction(input: { appointmentId: string }): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.PATIENT) return { ok: false, error: "Only patients can review." };
  const me = await prisma.patientProfile.findUnique({ where: { userId: session.user.id } });
  if (!me) return { ok: false, error: "Patient profile not found." };

  const appt = await prisma.appointment.findUnique({ where: { id: input.appointmentId }, include: { review: true } });
  if (!appt || appt.patientId !== me.id || !appt.review) return { ok: false, error: "Not allowed." };
  if (appt.review.authorUserId !== session.user.id) return { ok: false, error: "Not allowed." };

  const reviewId = appt.review.id;
  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: reviewId } });
    const agg = await tx.review.aggregate({ where: { doctorId: appt.doctorId }, _avg: { rating: true }, _count: { _all: true } });
    await tx.doctorProfile.update({ where: { id: appt.doctorId }, data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count._all } });
    await tx.auditLog.create({
      data: { actorUserId: session.user.id, action: "review.deleted", targetType: "Appointment", targetId: appt.id },
    });
  });

  revalidatePath(`/doctor/${appt.doctorId}`);
  revalidatePath(`/patient/appointments/${appt.id}`);
  return { ok: true };
}

/** Admin removes any review (moderation); doctor rating average is recomputed. */
export async function adminDeleteReviewAction(input: { reviewId: string }): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) return { ok: false, error: "Admin only." };

  const review = await prisma.review.findUnique({ where: { id: input.reviewId } });
  if (!review) return { ok: false, error: "Review not found." };

  const { id: reviewId, doctorId, rating } = review;
  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: reviewId } });
    const agg = await tx.review.aggregate({ where: { doctorId }, _avg: { rating: true }, _count: { _all: true } });
    await tx.doctorProfile.update({ where: { id: doctorId }, data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count._all } });
    await tx.auditLog.create({
      data: { actorUserId: session.user.id, action: "review.moderated_delete", targetType: "Review", targetId: reviewId, meta: { doctorId, rating } },
    });
  });

  revalidatePath("/admin/reviews");
  revalidatePath(`/doctor/${doctorId}`);
  return { ok: true };
}
