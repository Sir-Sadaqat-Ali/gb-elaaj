// Server helpers for computing a provider's available balance + recent requests.
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ProviderResolution = {
  role: Role;
  providerId: string;
  available: number;
  withdrawals: {
    id: string;
    amountPaisa: number;
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    status: string;
    reason: string | null;
    createdAt: string;
  }[];
};

export async function getProviderWithdrawalContext(userId: string, role: Role): Promise<ProviderResolution | null> {
  let providerId: string | null = null;
  if (role === Role.DOCTOR) {
    const d = await prisma.doctorProfile.findUnique({ where: { userId } });
    providerId = d?.id ?? null;
  } else if (role === Role.PHARMACY_ADMIN) {
    const p = await prisma.pharmacy.findUnique({ where: { ownerUserId: userId } });
    providerId = p?.id ?? null;
  } else if (role === Role.LAB_ADMIN) {
    const l = await prisma.lab.findUnique({ where: { ownerUserId: userId } });
    providerId = l?.id ?? null;
  } else if (role === Role.NURSE) {
    const n = await prisma.nurseProfile.findUnique({ where: { userId } });
    providerId = n?.id ?? null;
  }
  if (!providerId) return null;

  const [earned, obligations, withdrawals] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { netPaisa: true },
      where: { providerRole: role, providerId, status: "SUCCEEDED" },
    }),
    prisma.withdrawal.aggregate({
      _sum: { amountPaisa: true },
      where: { providerUserId: userId, status: { in: ["REQUESTED", "APPROVED", "PAID", "HOLD"] } },
    }),
    prisma.withdrawal.findMany({
      where: { providerUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);
  const available = (earned._sum.netPaisa ?? 0) - (obligations._sum.amountPaisa ?? 0);
  return {
    role,
    providerId,
    available,
    withdrawals: withdrawals.map((w) => ({
      id: w.id,
      amountPaisa: w.amountPaisa,
      bankName: w.bankName,
      accountTitle: w.accountTitle,
      accountNumber: w.accountNumber,
      status: w.status,
      reason: w.reason,
      createdAt: w.createdAt.toISOString(),
    })),
  };
}
