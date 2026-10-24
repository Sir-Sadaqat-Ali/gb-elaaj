"use server";

import { revalidatePath } from "next/cache";
import { Role, TransactionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatPkr } from "@/lib/formatting";
import type { ActionResult } from "@/lib/actions/appointments";

/**
 * Finance (or admin) refunds a successful payment. Only the money record is
 * flipped to REFUNDED here — reversing the underlying appointment/order state
 * is the relevant cancel action's job. The payer is notified and it's audited.
 */
export async function refundTransactionAction(input: { transactionId: string }): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || (session.user.role !== Role.FINANCE && session.user.role !== Role.ADMIN)) {
    return { ok: false, error: "Finance or admin only." };
  }

  const txn = await prisma.transaction.findUnique({ where: { id: input.transactionId } });
  if (!txn) return { ok: false, error: "Transaction not found." };
  if (txn.status !== TransactionStatus.SUCCEEDED) {
    return { ok: false, error: "Only successful payments can be refunded." };
  }

  const actorUserId = session.user.id;
  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({ where: { id: txn.id }, data: { status: TransactionStatus.REFUNDED } });
    if (txn.payerUserId) {
      await tx.notification.create({
        data: {
          userId: txn.payerUserId,
          title: "Payment refunded",
          body: `A refund of ${formatPkr(txn.grossPaisa)} has been processed for your payment.`,
          href: "/patient/dashboard",
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "txn.refunded",
        targetType: "Transaction",
        targetId: txn.id,
        meta: { grossPaisa: txn.grossPaisa, kind: txn.kind },
      },
    });
  });

  revalidatePath("/finance/transactions");
  revalidatePath("/finance/dashboard");
  return { ok: true };
}
