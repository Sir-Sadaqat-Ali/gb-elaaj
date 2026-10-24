"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Role,
  PharmacyOrderStatus,
  TransactionKind,
  TransactionStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { calcCommission } from "@/lib/commission";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  type CreateOrderInput,
} from "@/lib/validation/commerce";
import type { ActionResult } from "@/lib/actions/appointments";

const DELIVERY_PAISA = 15_000;

// ── Patient places order ────────────────────────────────────
export async function createPharmacyOrderAction(input: CreateOrderInput): Promise<ActionResult<{ orderId: string }>> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Cart or address invalid." };
  const session = await auth();
  if (!session?.user || session.user.role !== Role.PATIENT) return { ok: false, error: "Sign in as a patient." };
  const me = await prisma.patientProfile.findUnique({ where: { userId: session.user.id } });
  if (!me) return { ok: false, error: "Patient profile not found." };

  const meds = await prisma.medicine.findMany({
    where: { id: { in: parsed.data.items.map((i) => i.medicineId) }, active: true },
    include: { pharmacy: true },
  });
  if (meds.length !== parsed.data.items.length) return { ok: false, error: "Some items aren't available." };

  // All items must come from the same pharmacy in v1 (simplifies fulfillment)
  const pharmacyIds = new Set(meds.map((m) => m.pharmacyId));
  if (pharmacyIds.size > 1) return { ok: false, error: "Cart must be from a single pharmacy." };
  const pharmacyId = [...pharmacyIds][0];

  const needsRx = meds.some((m) => m.rxRequired);
  if (needsRx && !parsed.data.prescriptionKey) {
    return { ok: false, error: "Some items require a prescription. Upload one or remove them." };
  }

  // Stock check
  for (const it of parsed.data.items) {
    const m = meds.find((x) => x.id === it.medicineId)!;
    if (m.stock < it.qty) return { ok: false, error: `${m.nameBrand ?? m.nameGeneric} is out of stock.` };
  }

  let subtotal = 0;
  const itemsToCreate = parsed.data.items.map((it) => {
    const m = meds.find((x) => x.id === it.medicineId)!;
    const total = m.pricePaisa * it.qty;
    subtotal += total;
    return { medicineId: m.id, qty: it.qty, unitPaisa: m.pricePaisa, totalPaisa: total };
  });
  const total = subtotal + DELIVERY_PAISA;

  let orderId = "";
  await prisma.$transaction(async (tx) => {
    const order = await tx.pharmacyOrder.create({
      data: {
        patientId: me.id,
        pharmacyId,
        status: needsRx ? PharmacyOrderStatus.PENDING_RX_REVIEW : PharmacyOrderStatus.CONFIRMED,
        prescriptionKey: parsed.data.prescriptionKey ?? null,
        prescriptionMime: parsed.data.prescriptionMime ?? null,
        prescriptionSize: parsed.data.prescriptionSize ?? null,
        subtotalPaisa: subtotal,
        deliveryPaisa: DELIVERY_PAISA,
        totalPaisa: total,
        addressLine: parsed.data.addressLine,
        cityName: parsed.data.cityName,
        items: { create: itemsToCreate },
      },
    });
    orderId = order.id;

    // decrement stock
    for (const it of parsed.data.items) {
      await tx.medicine.update({
        where: { id: it.medicineId },
        data: { stock: { decrement: it.qty } },
      });
    }

    const commission = await calcCommission(total, TransactionKind.PHARMACY);
    await tx.transaction.create({
      data: {
        kind: TransactionKind.PHARMACY,
        status: TransactionStatus.SUCCEEDED,
        grossPaisa: commission.grossPaisa,
        commissionPaisa: commission.commissionPaisa,
        netPaisa: commission.netPaisa,
        provider: parsed.data.paymentMethod,
        payerUserId: session.user.id,
        providerRole: Role.PHARMACY_ADMIN,
        providerId: pharmacyId,
        pharmacyOrderId: order.id,
        capturedAt: new Date(),
      },
    });

    const pharmacy = meds[0].pharmacy;
    await tx.notification.create({
      data: {
        userId: pharmacy.ownerUserId,
        title: needsRx ? "New order — Rx review needed" : "New order confirmed",
        body: `Order #${order.id.slice(-6).toUpperCase()} from ${session.user.name ?? "a customer"}.`,
        href: `/pharmacy-admin/orders/${order.id}`,
      },
    });
    await tx.notification.create({
      data: {
        userId: session.user.id,
        title: "Order placed",
        body: `Order #${order.id.slice(-6).toUpperCase()} ${needsRx ? "is awaiting prescription review" : "is confirmed"}.`,
        href: `/patient/pharmacy/orders/${order.id}`,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "pharmacy.order.placed",
        targetType: "PharmacyOrder",
        targetId: order.id,
        meta: { items: itemsToCreate.length, total, needsRx },
      },
    });
  });

  revalidatePath("/patient/pharmacy");
  revalidatePath("/pharmacy-admin/orders");
  revalidatePath("/pharmacy-admin/dashboard");
  redirect(`/patient/pharmacy/orders/${orderId}?placed=1`);
}

// ── Pharmacy admin updates status ────────────────────────────
export async function updatePharmacyOrderStatusAction(input: {
  orderId: string;
  status: "CONFIRMED" | "PACKING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
}): Promise<ActionResult> {
  const parsed = updateOrderStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in." };

  const order = await prisma.pharmacyOrder.findUnique({
    where: { id: parsed.data.orderId },
    include: { pharmacy: true, patient: { include: { user: true } } },
  });
  if (!order) return { ok: false, error: "Order not found." };

  const allowed =
    (session.user.role === Role.PHARMACY_ADMIN && order.pharmacy.ownerUserId === session.user.id) ||
    session.user.role === Role.ADMIN;
  if (!allowed) return { ok: false, error: "Not allowed." };

  await prisma.$transaction(async (tx) => {
    await tx.pharmacyOrder.update({
      where: { id: order.id },
      data: {
        status: parsed.data.status as PharmacyOrderStatus,
        deliveredAt: parsed.data.status === "DELIVERED" ? new Date() : order.deliveredAt,
      },
    });
    await tx.notification.create({
      data: {
        userId: order.patient.userId,
        title: `Order #${order.id.slice(-6).toUpperCase()} — ${parsed.data.status.toLowerCase().replaceAll("_", " ")}`,
        body: `Your pharmacy order is now ${parsed.data.status.toLowerCase().replaceAll("_", " ")}.`,
        href: `/patient/pharmacy/orders/${order.id}`,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "pharmacy.order.status",
        targetType: "PharmacyOrder",
        targetId: order.id,
        meta: { status: parsed.data.status },
      },
    });
  });

  revalidatePath(`/pharmacy-admin/orders`);
  revalidatePath(`/pharmacy-admin/orders/${order.id}`);
  revalidatePath(`/patient/pharmacy/orders/${order.id}`);
  return { ok: true };
}
