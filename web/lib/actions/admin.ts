"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { verificationDecisionSchema } from "@/lib/validation/booking";
import type { ActionResult } from "@/lib/actions/appointments";
import { sendEmailFor } from "@/lib/notifications/send-email";

// ── Platform settings (admin) ────────────────────────────────
// FormData-based so it can be used directly as a <form action={...}>.
export async function updatePlatformSettingsAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) return;

  const intOr = (key: string, fallback: number) => {
    const n = Number(formData.get(key));
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
  };
  const strOr = (key: string, fallback: string) => {
    const v = formData.get(key);
    return typeof v === "string" && v.trim() ? v.trim() : fallback;
  };

  await prisma.platformSetting.update({
    where: { id: "singleton" },
    data: {
      commissionBps: intOr("commissionBps", 1500),
      currency: strOr("currency", "PKR"),
      slotMinutes: intOr("slotMinutes", 20),
      reminderHoursBefore: intOr("reminderHoursBefore", 2),
      supportEmail: strOr("supportEmail", "support@gbelaaj.pk"),
      supportPhone: strOr("supportPhone", "+92 311 1234567"),
      commissionOverrides: {
        CONSULTATION: intOr("ovr_CONSULTATION", 1500),
        PHARMACY: intOr("ovr_PHARMACY", 800),
        LAB: intOr("ovr_LAB", 1200),
        HOME_CARE: intOr("ovr_HOME_CARE", 1500),
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "settings.updated",
      targetType: "PlatformSetting",
      targetId: "singleton",
    },
  });

  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}

export async function decideDoctorVerificationAction(input: {
  doctorId: string;
  decision: "APPROVE" | "REJECT";
  note?: string;
}): Promise<ActionResult> {
  const parsed = verificationDecisionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) return { ok: false, error: "Admin only." };

  const doctor = await prisma.doctorProfile.findUnique({ where: { id: parsed.data.doctorId }, include: { user: true } });
  if (!doctor) return { ok: false, error: "Doctor not found." };

  const status = parsed.data.decision === "APPROVE" ? "APPROVED" : "REJECTED";
  await prisma.$transaction(async (tx) => {
    await tx.doctorProfile.update({
      where: { id: doctor.id },
      data: {
        verifiedStatus: status,
        verifiedAt: status === "APPROVED" ? new Date() : null,
        verifiedNote: parsed.data.note ?? null,
      },
    });
    await tx.notification.create({
      data: {
        userId: doctor.userId,
        title: status === "APPROVED" ? "You're verified!" : "Verification update",
        body:
          status === "APPROVED"
            ? "Your Gb Elaaj profile is live and accepting appointments."
            : `Your verification needs more information: ${parsed.data.note ?? "please contact support"}`,
        href: status === "APPROVED" ? "/doctor/dashboard" : "/doctor/public-profile",
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: status === "APPROVED" ? "doctor.verified" : "doctor.rejected",
        targetType: "DoctorProfile",
        targetId: doctor.id,
        meta: { note: parsed.data.note ?? null },
      },
    });
  });

  await sendEmailFor({
    userId: doctor.userId,
    template: "doctor.verification.status",
    data: { status, note: parsed.data.note ?? "" },
  });

  revalidatePath("/admin/doctor-verification");
  revalidatePath("/admin/doctors");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}

// ── User management (admin) ──────────────────────────────────
// Suspend blocks login (lib/auth.ts rejects SUSPENDED at authorize time);
// reactivate restores it. Role changes are intentionally NOT handled here —
// switching a role without provisioning that role's profile would break the
// target's dashboards, so that needs its own provisioning flow.
export async function setUserStatusAction(input: {
  userId: string;
  status: "ACTIVE" | "SUSPENDED";
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) return { ok: false, error: "Admin only." };

  const { userId, status } = input;
  if (!userId || (status !== "ACTIVE" && status !== "SUSPENDED")) return { ok: false, error: "Invalid input." };
  if (userId === session.user.id) return { ok: false, error: "You can't change your own status." };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "User not found." };
  if (target.status === status) return { ok: true };

  // Never lock the platform out of admin access.
  if (status === "SUSPENDED" && target.role === Role.ADMIN) {
    const activeAdmins = await prisma.user.count({ where: { role: Role.ADMIN, status: "ACTIVE" } });
    if (activeAdmins <= 1) return { ok: false, error: "Can't suspend the last active admin." };
  }

  await prisma.user.update({ where: { id: userId }, data: { status } });
  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: status === "SUSPENDED" ? "user.suspended" : "user.reactivated",
      targetType: "User",
      targetId: userId,
      meta: { role: target.role, email: target.email },
    },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}
