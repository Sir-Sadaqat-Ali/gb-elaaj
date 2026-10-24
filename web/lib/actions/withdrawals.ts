"use server";

import { revalidatePath } from "next/cache";
import { Role, WithdrawalStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  requestWithdrawalSchema,
  decideWithdrawalSchema,
  type RequestWithdrawalInput,
} from "@/lib/validation/commerce";
import type { ActionResult } from "@/lib/actions/appointments";
import { sendEmailFor } from "@/lib/notifications/send-email";

const PROVIDER_ROLES: Role[] = [Role.DOCTOR, Role.PHARMACY_ADMIN, Role.LAB_ADMIN, Role.NURSE];

// ── Provider lifetime balance helper ────────────────────────
async function providerBalance(role: Role, providerId: string) {
  const earned = await prisma.transaction.aggregate({
    _sum: { netPaisa: true },
    where: { providerRole: role, providerId, status: "SUCCEEDED" },
  });
  const paidOrPending = await prisma.withdrawal.aggregate({
    _sum: { amountPaisa: true },
    where: { providerRole: role, providerUserId: { not: undefined }, status: { in: ["REQUESTED", "APPROVED", "PAID", "HOLD"] } },
  });
  // We only count a provider's own withdrawals — but providerUserId isn't role-scoped, so
  // the caller passes their userId for accuracy. This helper is a fallback.
  return (earned._sum.netPaisa ?? 0) - (paidOrPending._sum.amountPaisa ?? 0);
}

// ── Provider requests withdrawal ────────────────────────────
export async function requestWithdrawalAction(input: RequestWithdrawalInput): Promise<ActionResult> {
  const parsed = requestWithdrawalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Bank details or amount invalid." };
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in." };
  if (!PROVIDER_ROLES.includes(session.user.role)) return { ok: false, error: "Only providers can request payouts." };

  // Resolve providerId from role profile
  let providerId: string | null = null;
  if (session.user.role === Role.DOCTOR) {
    const d = await prisma.doctorProfile.findUnique({ where: { userId: session.user.id } });
    providerId = d?.id ?? null;
  } else if (session.user.role === Role.PHARMACY_ADMIN) {
    const p = await prisma.pharmacy.findUnique({ where: { ownerUserId: session.user.id } });
    providerId = p?.id ?? null;
  } else if (session.user.role === Role.LAB_ADMIN) {
    const l = await prisma.lab.findUnique({ where: { ownerUserId: session.user.id } });
    providerId = l?.id ?? null;
  } else if (session.user.role === Role.NURSE) {
    const n = await prisma.nurseProfile.findUnique({ where: { userId: session.user.id } });
    providerId = n?.id ?? null;
  }
  if (!providerId) return { ok: false, error: "Provider profile not found." };

  // Compute available balance = succeeded earnings minus all non-rejected withdrawals
  const earned = await prisma.transaction.aggregate({
    _sum: { netPaisa: true },
    where: { providerRole: session.user.role, providerId, status: "SUCCEEDED" },
  });
  const obligations = await prisma.withdrawal.aggregate({
    _sum: { amountPaisa: true },
    where: { providerUserId: session.user.id, status: { in: ["REQUESTED", "APPROVED", "PAID", "HOLD"] } },
  });
  const available = (earned._sum.netPaisa ?? 0) - (obligations._sum.amountPaisa ?? 0);
  if (parsed.data.amountPaisa > available) {
    return { ok: false, error: `Insufficient balance. Available: ${(available / 100).toLocaleString("en-PK")} PKR.` };
  }

  await prisma.$transaction(async (tx) => {
    const wd = await tx.withdrawal.create({
      data: {
        providerUserId: session.user.id,
        providerRole: session.user.role,
        amountPaisa: parsed.data.amountPaisa,
        bankName: parsed.data.bankName,
        accountTitle: parsed.data.accountTitle,
        accountNumber: parsed.data.accountNumber,
        status: WithdrawalStatus.REQUESTED,
      },
    });
    const finance = await tx.user.findMany({ where: { role: { in: [Role.FINANCE, Role.ADMIN] } }, select: { id: true } });
    for (const f of finance) {
      await tx.notification.create({
        data: {
          userId: f.id,
          title: "Withdrawal requested",
          body: `${session.user.name} requested ${(parsed.data.amountPaisa / 100).toLocaleString("en-PK")} PKR.`,
          href: "/finance/withdrawals",
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "withdrawal.requested",
        targetType: "Withdrawal",
        targetId: wd.id,
        meta: { amount: parsed.data.amountPaisa },
      },
    });
  });

  // Revalidate role-specific withdrawals page
  if (session.user.role === Role.DOCTOR) revalidatePath("/doctor/withdrawals");
  if (session.user.role === Role.PHARMACY_ADMIN) revalidatePath("/pharmacy-admin/withdrawals");
  if (session.user.role === Role.LAB_ADMIN) revalidatePath("/lab-admin/withdrawals");
  if (session.user.role === Role.NURSE) revalidatePath("/nurse/withdrawals");
  revalidatePath("/finance/withdrawals");
  return { ok: true };
}

// ── Finance / admin decide ─────────────────────────────────
export async function decideWithdrawalAction(input: {
  withdrawalId: string;
  decision: "APPROVE" | "REJECT" | "PAY" | "HOLD";
  reason?: string;
}): Promise<ActionResult> {
  const parsed = decideWithdrawalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const session = await auth();
  if (!session?.user || (session.user.role !== Role.FINANCE && session.user.role !== Role.ADMIN)) {
    return { ok: false, error: "Finance or admin only." };
  }

  const wd = await prisma.withdrawal.findUnique({ where: { id: parsed.data.withdrawalId }, include: { provider: true } });
  if (!wd) return { ok: false, error: "Withdrawal not found." };

  const map: Record<string, WithdrawalStatus> = {
    APPROVE: "APPROVED",
    REJECT: "REJECTED",
    PAY: "PAID",
    HOLD: "HOLD",
  };
  const next = map[parsed.data.decision];

  await prisma.$transaction(async (tx) => {
    await tx.withdrawal.update({
      where: { id: wd.id },
      data: {
        status: next,
        reason: parsed.data.reason ?? null,
        approvedById: parsed.data.decision === "APPROVE" || parsed.data.decision === "PAY" ? session.user.id : null,
        approvedAt: parsed.data.decision === "APPROVE" || parsed.data.decision === "PAY" ? new Date() : null,
        paidAt: parsed.data.decision === "PAY" ? new Date() : wd.paidAt,
      },
    });
    await tx.notification.create({
      data: {
        userId: wd.providerUserId,
        title: `Withdrawal · ${next.toLowerCase()}`,
        body:
          next === "APPROVED"
            ? "Your withdrawal request has been approved and will be paid soon."
            : next === "PAID"
            ? "Your withdrawal has been paid out."
            : next === "REJECTED"
            ? `Your withdrawal was rejected: ${parsed.data.reason ?? "see finance"}`
            : "Your withdrawal is on hold.",
        href: roleWithdrawalsPath(wd.providerRole),
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: `withdrawal.${parsed.data.decision.toLowerCase()}`,
        targetType: "Withdrawal",
        targetId: wd.id,
        meta: { reason: parsed.data.reason ?? null },
      },
    });
  });

  // Email the provider with the status change.
  await sendEmailFor({
    userId: wd.providerUserId,
    template: "withdrawal.status",
    data: {
      status: next.toLowerCase(),
      amount: `PKR ${(wd.amountPaisa / 100).toLocaleString()}`,
      note: parsed.data.reason ?? "",
      providerRoleHomePath: roleWithdrawalsPath(wd.providerRole).replace(/^\//, ""),
    },
  });

  revalidatePath("/finance/withdrawals");
  revalidatePath(roleWithdrawalsPath(wd.providerRole));
  return { ok: true };
}

function roleWithdrawalsPath(role: Role): string {
  switch (role) {
    case "DOCTOR": return "/doctor/withdrawals";
    case "PHARMACY_ADMIN": return "/pharmacy-admin/withdrawals";
    case "LAB_ADMIN": return "/lab-admin/withdrawals";
    case "NURSE": return "/nurse/withdrawals";
    default: return "/";
  }
}
