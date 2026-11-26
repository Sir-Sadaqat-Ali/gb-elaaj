import crypto from "crypto";
import { prisma } from "@/lib/db";
import { Role, AppointmentStatus, SlotStatus, TransactionStatus } from "@prisma/client";
import { sendEmailFor } from "@/lib/notifications/send-email";
import { formatPkr } from "@/lib/formatting";

export interface EasyPaisaCheckoutParams {
  orderRefNum: string;
  amountPaisa: number;
  email: string;
  phone?: string;
  appointmentId: string;
  doctorName: string;
}

export function getEasyPaisaConfig() {
  const storeId = process.env.EASYPAISA_STORE_ID || "";
  const hashKey = process.env.EASYPAISA_HASH_KEY || "";
  const isConfigured = Boolean(storeId && hashKey);
  const isProduction = process.env.EASYPAISA_ENV === "production" || (process.env.NODE_ENV === "production" && isConfigured);

  const postUrl = isProduction
    ? "https://easypay.easypaisa.com.pk/easypay/Index.jsf"
    : "https://easypaystg.easypaisa.com.pk/easypay/Index.jsf";

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.gbelaaj.com").replace(/\/$/, "");

  return {
    storeId,
    hashKey,
    isConfigured,
    isProduction,
    postUrl,
    appUrl,
  };
}

/**
 * Calculates HMAC-SHA256 or SHA256 merchant hashed request for EasyPaisa Hosted Checkout.
 */
export function generateEasyPaisaHash(params: Record<string, string>, hashKey: string): string {
  // Sort parameters alphabetically as required by EasyPaisa PGW API specs
  const sortedKeys = Object.keys(params).sort();
  const sortedString = sortedKeys.map((k) => `${k}=${params[k]}`).join("&");
  return crypto.createHmac("sha256", hashKey).update(sortedString).digest("hex");
}

/**
 * Generates the redirect URL for EasyPaisa payment.
 * If live credentials are not set in .env, falls back to the interactive Sandbox simulation page.
 */
export async function createEasyPaisaPaymentUrl(params: EasyPaisaCheckoutParams): Promise<string> {
  const config = getEasyPaisaConfig();
  const amountPkr = (params.amountPaisa / 100).toFixed(2);

  // If live credentials are provided in .env, generate official EasyPaisa Hosted Checkout URL
  if (config.isConfigured) {
    const postBackURL = `${config.appUrl}/api/payments/easypaisa/callback`;

    // Expiry: 1 hour from now in format YYYYMMDD HHMMSS
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const expiryDate = `${expiry.getUTCFullYear()}${pad(expiry.getUTCMonth() + 1)}${pad(expiry.getUTCDate())} ${pad(expiry.getUTCHours())}${pad(expiry.getUTCMinutes())}${pad(expiry.getUTCSeconds())}`;

    const requestParams: Record<string, string> = {
      amount: amountPkr,
      autoRedirect: "1",
      emailAddr: params.email,
      expiryDate,
      mobileNum: params.phone || "03001234567",
      orderRefNum: params.orderRefNum,
      paymentMethod: "InitialPaymentRequest",
      postBackURL,
      storeId: config.storeId,
    };

    const hash = generateEasyPaisaHash(requestParams, config.hashKey);
    const query = new URLSearchParams({
      ...requestParams,
      merchantHashedReq: hash,
    }).toString();

    return `${config.postUrl}?${query}`;
  }

  // Fallback / Sandbox mode: Interactive sandbox simulation for immediate client testing
  const sandboxParams = new URLSearchParams({
    orderId: params.orderRefNum,
    apptId: params.appointmentId,
    amount: String(params.amountPaisa),
    doctor: params.doctorName,
  });

  return `${config.appUrl}/checkout/easypaisa?${sandboxParams.toString()}`;
}

/**
 * Handles confirmation when EasyPaisa callback / IPN reports successful payment.
 */
export async function handleEasyPaisaPaymentSuccess({
  appointmentId,
  transactionId,
  orderRefNum,
}: {
  appointmentId: string;
  transactionId: string;
  orderRefNum: string;
}) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: { include: { user: true } },
      patient: { include: { user: true } },
      slot: true,
      transaction: true,
    },
  });

  if (!appointment) {
    throw new Error(`Appointment ${appointmentId} not found`);
  }

  // 1. Mark appointment as CONFIRMED
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.CONFIRMED,
      videoRoomId: appointment.mode === "VIDEO" ? `appt-${appointment.id}` : null,
    },
  });

  // 2. Mark slot as BOOKED
  if (appointment.slotId) {
    await prisma.doctorAvailability.updateMany({
      where: {
        doctorId: appointment.doctorId,
        startsAt: appointment.scheduledFor,
      },
      data: { status: SlotStatus.BOOKED },
    });
  }

  // 3. Mark transaction as SUCCEEDED
  if (appointment.transaction) {
    await prisma.transaction.update({
      where: { id: appointment.transaction.id },
      data: {
        status: TransactionStatus.SUCCEEDED,
        provider: "easypaisa",
        providerRef: transactionId,
        capturedAt: new Date(),
      },
    });
  }

  // 4. Send Notifications
  await prisma.notification.create({
    data: {
      userId: appointment.doctor.userId,
      title: "EasyPaisa payment verified · Appointment confirmed",
      body: `${appointment.patient.user.name} has paid consultation fee via EasyPaisa (${formatPkr(appointment.feePaisa)}). Scheduled for ${appointment.scheduledFor.toLocaleString()}.`,
      href: `/doctor/appointments`,
    },
  });

  await prisma.notification.create({
    data: {
      userId: appointment.patient.userId,
      title: "EasyPaisa payment successful!",
      body: `Your payment of ${formatPkr(appointment.feePaisa)} was received. Consultation with ${appointment.doctor.user.name} is confirmed.`,
      href: `/patient/appointments/${appointment.id}`,
    },
  });

  // 5. Send Email Confirmation
  try {
    await sendEmailFor({
      userId: appointment.patient.userId,
      template: "appointment.confirmed",
      data: {
        doctorName: appointment.doctor.user.name,
        when: appointment.scheduledFor.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }),
        mode: appointment.mode === "VIDEO" ? "Video consultation" : "Clinic visit",
        feeText: formatPkr(appointment.feePaisa),
        appointmentId: appointment.id,
      },
    });
  } catch (err) {
    console.error("[easypaisa] Email error:", err);
  }

  return appointment;
}

/**
 * Handles payment failure / cancellation from EasyPaisa.
 */
export async function handleEasyPaisaPaymentFailure({
  appointmentId,
  reason,
}: {
  appointmentId: string;
  reason: string;
}) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { slot: true, transaction: true },
  });

  if (!appointment) return;

  // Mark appointment as CANCELLED
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: AppointmentStatus.CANCELLED },
  });

  // Re-open slot
  if (appointment.slotId) {
    await prisma.doctorAvailability.update({
      where: { id: appointment.slotId },
      data: { status: SlotStatus.OPEN },
    });
  }

  // Mark transaction as FAILED
  if (appointment.transaction) {
    await prisma.transaction.update({
      where: { id: appointment.transaction.id },
      data: {
        status: TransactionStatus.FAILED,
        provider: "easypaisa",
      },
    });
  }
}
