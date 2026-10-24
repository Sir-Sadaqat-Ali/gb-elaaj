"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Role,
  HomeCareStatus,
  TransactionKind,
  TransactionStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { calcCommission } from "@/lib/commission";
import { getMapsProvider } from "@/lib/maps";
import {
  requestHomeCareSchema,
  assignNurseSchema,
  updateHomeCareStatusSchema,
  type RequestHomeCareInput,
} from "@/lib/validation/commerce";
import type { ActionResult } from "@/lib/actions/appointments";

export async function requestHomeCareAction(input: RequestHomeCareInput): Promise<ActionResult<{ requestId: string }>> {
  const parsed = requestHomeCareSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const session = await auth();
  if (!session?.user || session.user.role !== Role.PATIENT) return { ok: false, error: "Sign in as a patient." };
  const me = await prisma.patientProfile.findUnique({ where: { userId: session.user.id } });
  if (!me) return { ok: false, error: "Patient profile not found." };

  const scheduledFor = new Date(parsed.data.scheduledFor);
  if (Number.isNaN(scheduledFor.getTime()) || scheduledFor.getTime() < Date.now() - 60_000) {
    return { ok: false, error: "Pick a future date/time." };
  }

  let requestId = "";
  await prisma.$transaction(async (tx) => {
    const req = await tx.homeCareRequest.create({
      data: {
        patientId: me.id,
        serviceName: parsed.data.serviceName,
        description: parsed.data.description,
        status: HomeCareStatus.REQUESTED,
        scheduledFor,
        durationMin: parsed.data.durationMin,
        addressLine: parsed.data.addressLine,
        pricePaisa: parsed.data.pricePaisa,
      },
    });
    requestId = req.id;

    const commission = await calcCommission(parsed.data.pricePaisa, TransactionKind.HOME_CARE);
    // Provider id is unknown at request time; fill once nurse is assigned.
    await tx.transaction.create({
      data: {
        kind: TransactionKind.HOME_CARE,
        status: TransactionStatus.PENDING,
        grossPaisa: commission.grossPaisa,
        commissionPaisa: commission.commissionPaisa,
        netPaisa: commission.netPaisa,
        provider: parsed.data.paymentMethod,
        payerUserId: session.user.id,
        providerRole: Role.NURSE,
        providerId: null,
        homeCareId: req.id,
      },
    });
    // Notify all admins
    const admins = await tx.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    for (const a of admins) {
      await tx.notification.create({
        data: {
          userId: a.id,
          title: "Home-care request",
          body: `${session.user.name ?? "A patient"} requested ${parsed.data.serviceName}.`,
          href: "/admin/nurse-assignment",
        },
      });
    }
    await tx.notification.create({
      data: {
        userId: session.user.id,
        title: "Home-care requested",
        body: `Your request for ${parsed.data.serviceName} is queued for nurse assignment.`,
        href: "/patient/home-care",
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "home_care.requested",
        targetType: "HomeCareRequest",
        targetId: req.id,
        meta: { service: parsed.data.serviceName },
      },
    });
  });

  // Fire-and-forget: geocode the address so the patient/nurse map can plot
  // the destination later. Failure is non-blocking — coords stay null and the
  // tracking pages render an "address only" mode. Awaited inline here because
  // the redirect below would otherwise abort the unawaited promise.
  try {
    const coords = await getMapsProvider().geocode(parsed.data.addressLine);
    if (coords) {
      await prisma.homeCareRequest.update({
        where: { id: requestId },
        data: { addressLat: coords.lat, addressLng: coords.lng },
      });
    }
  } catch (e) {
    console.warn("[home-care] geocode failed:", e);
  }

  revalidatePath("/patient/home-care");
  revalidatePath("/admin/nurse-assignment");
  redirect(`/patient/home-care?requested=1`);
}

// ── Admin assigns a nurse ───────────────────────────────────
export async function assignNurseAction(input: { requestId: string; nurseId: string }): Promise<ActionResult> {
  const parsed = assignNurseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) return { ok: false, error: "Admin only." };

  const req = await prisma.homeCareRequest.findUnique({
    where: { id: parsed.data.requestId },
    include: { patient: { include: { user: true } }, transaction: true },
  });
  if (!req) return { ok: false, error: "Request not found." };
  const nurse = await prisma.nurseProfile.findUnique({ where: { id: parsed.data.nurseId }, include: { user: true } });
  if (!nurse) return { ok: false, error: "Nurse not found." };

  await prisma.$transaction(async (tx) => {
    await tx.homeCareRequest.update({
      where: { id: req.id },
      data: { nurseId: nurse.id, status: HomeCareStatus.ASSIGNED },
    });
    if (req.transaction) {
      await tx.transaction.update({
        where: { id: req.transaction.id },
        data: { providerId: nurse.id, status: TransactionStatus.SUCCEEDED, capturedAt: new Date() },
      });
    }
    await tx.notification.create({
      data: {
        userId: nurse.userId,
        title: "New assignment",
        body: `${req.patient.user.name} · ${req.serviceName}`,
        href: "/nurse/assignments",
      },
    });
    await tx.notification.create({
      data: {
        userId: req.patient.userId,
        title: "Nurse assigned",
        body: `${nurse.user.name} will visit you for ${req.serviceName}.`,
        href: "/patient/home-care",
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "home_care.assigned",
        targetType: "HomeCareRequest",
        targetId: req.id,
        meta: { nurseId: nurse.id },
      },
    });
  });

  // Fallback geocode: if the request was created before we had Mapbox wired,
  // the addressLat/Lng will still be null. Try once at assign time.
  if (req.addressLat == null || req.addressLng == null) {
    try {
      const coords = await getMapsProvider().geocode(req.addressLine);
      if (coords) {
        await prisma.homeCareRequest.update({
          where: { id: req.id },
          data: { addressLat: coords.lat, addressLng: coords.lng },
        });
      }
    } catch (e) {
      console.warn("[home-care] backfill geocode failed:", e);
    }
  }

  revalidatePath("/admin/nurse-assignment");
  revalidatePath("/nurse/assignments");
  revalidatePath("/patient/home-care");
  return { ok: true };
}

// ── Nurse / admin update status ─────────────────────────────
export async function updateHomeCareStatusAction(input: {
  requestId: string;
  status: "REQUESTED" | "ASSIGNED" | "EN_ROUTE" | "IN_VISIT" | "COMPLETED" | "CANCELLED";
}): Promise<ActionResult> {
  const parsed = updateHomeCareStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in." };

  const req = await prisma.homeCareRequest.findUnique({
    where: { id: parsed.data.requestId },
    include: { nurse: true, patient: { include: { user: true } } },
  });
  if (!req) return { ok: false, error: "Request not found." };
  const allowed =
    (session.user.role === Role.NURSE && req.nurse?.userId === session.user.id) ||
    session.user.role === Role.ADMIN;
  if (!allowed) return { ok: false, error: "Not allowed." };

  await prisma.homeCareRequest.update({
    where: { id: req.id },
    data: {
      status: parsed.data.status as HomeCareStatus,
      startedAt: parsed.data.status === "IN_VISIT" ? new Date() : req.startedAt,
      endedAt: parsed.data.status === "COMPLETED" ? new Date() : req.endedAt,
    },
  });
  await prisma.notification.create({
    data: {
      userId: req.patient.userId,
      title: `Home care · ${parsed.data.status.toLowerCase().replaceAll("_", " ")}`,
      body: `Your home-care request is now ${parsed.data.status.toLowerCase()}.`,
      href: "/patient/home-care",
    },
  });
  revalidatePath("/nurse/assignments");
  revalidatePath("/patient/home-care");
  revalidatePath("/admin/nurse-assignment");
  return { ok: true };
}

// ── Cancel a home-care request (patient owner or admin) ─────
// Allowed only before the nurse is on the way (REQUESTED / ASSIGNED).
export async function cancelHomeCareAction(input: { requestId: string }): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Please sign in." };

  const req = await prisma.homeCareRequest.findUnique({
    where: { id: input.requestId },
    include: { patient: true, transaction: true },
  });
  if (!req) return { ok: false, error: "Request not found." };

  const allowed =
    (session.user.role === Role.PATIENT && req.patient.userId === session.user.id) ||
    session.user.role === Role.ADMIN;
  if (!allowed) return { ok: false, error: "Not allowed." };
  if (req.status !== HomeCareStatus.REQUESTED && req.status !== HomeCareStatus.ASSIGNED) {
    return { ok: false, error: "This request can no longer be cancelled." };
  }
  const actorUserId = session.user.id;

  await prisma.$transaction(async (tx) => {
    await tx.homeCareRequest.update({ where: { id: req.id }, data: { status: HomeCareStatus.CANCELLED } });
    if (req.transaction) {
      await tx.transaction.update({ where: { id: req.transaction.id }, data: { status: TransactionStatus.REFUNDED } });
    }
    await tx.auditLog.create({
      data: { actorUserId, action: "home_care.cancelled", targetType: "HomeCareRequest", targetId: req.id },
    });
  });

  revalidatePath("/patient/home-care");
  revalidatePath("/admin/nurse-assignment");
  return { ok: true };
}
