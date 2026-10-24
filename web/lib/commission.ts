// ─────────────────────────────────────────────────────────────
// Commission calculator
// Reads PlatformSetting.commissionBps (default 1500 = 15%) and
// per-kind overrides from commissionOverrides JSON.
// ─────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db";
import type { TransactionKind } from "@prisma/client";

const DEFAULT_BPS = 1500;

export type CommissionResult = {
  grossPaisa: number;
  commissionPaisa: number;
  netPaisa: number;
  rateBps: number;
};

export async function getCommissionBps(kind: TransactionKind): Promise<number> {
  const setting = await prisma.platformSetting.findUnique({ where: { id: "singleton" } });
  const overrides = (setting?.commissionOverrides as Record<string, number> | null) ?? null;
  const overrideKey =
    kind === "PHARMACY"
      ? "PHARMACY"
      : kind === "LAB"
      ? "LAB"
      : kind === "HOME_CARE"
      ? "HOME_CARE"
      : kind === "CONSULTATION"
      ? "CONSULTATION"
      : null;
  if (overrideKey && overrides && typeof overrides[overrideKey] === "number") {
    return overrides[overrideKey];
  }
  return setting?.commissionBps ?? DEFAULT_BPS;
}

export async function calcCommission(
  grossPaisa: number,
  kind: TransactionKind
): Promise<CommissionResult> {
  const rateBps = await getCommissionBps(kind);
  const commissionPaisa = Math.round((grossPaisa * rateBps) / 10_000);
  return {
    grossPaisa,
    commissionPaisa,
    netPaisa: grossPaisa - commissionPaisa,
    rateBps,
  };
}
