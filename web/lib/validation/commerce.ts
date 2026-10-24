import { z } from "zod";

/**
 * Storage keys we control. Format: <category>/<userId>/<uuid>.<ext>.
 * Strict regex — rejects ".." or anything outside the documented scheme.
 */
const FILE_KEY_RE = /^(lab-report|prescription|medical-record|profile-photo|pmdc-doc)\/[A-Za-z0-9_-]{1,40}\/[A-Za-z0-9_-]{8,40}\.(pdf|png|jpg|webp)$/;
const fileKey = z.string().regex(FILE_KEY_RE, "Invalid storage key");
const fileMime = z.enum(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        medicineId: z.string().min(1),
        qty: z.coerce.number().int().min(1).max(50),
      })
    )
    .min(1, "Cart is empty"),
  addressLine: z.string().min(3).max(200),
  cityName: z.string().min(2).max(80),
  prescriptionKey: fileKey.optional().nullable(),
  prescriptionMime: fileMime.optional().nullable(),
  prescriptionSize: z.coerce.number().int().min(1).max(50 * 1024 * 1024).optional().nullable(),
  paymentMethod: z.enum(["bank_transfer", "card", "jazzcash", "easypaisa", "wallet"]).default("bank_transfer"),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["CONFIRMED", "PACKING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
});

export const bookLabTestSchema = z.object({
  testId: z.string().min(1),
  scheduledFor: z.string().min(1),
  mode: z.enum(["HOME", "WALK_IN"]).default("HOME"),
  addressLine: z.string().max(200).optional(),
  paymentMethod: z.enum(["bank_transfer", "card", "jazzcash", "easypaisa", "wallet"]).default("bank_transfer"),
});
export type BookLabTestInput = z.infer<typeof bookLabTestSchema>;

export const updateLabBookingStatusSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum(["BOOKED", "COLLECTED", "PROCESSING", "REPORTED", "CANCELLED"]),
});

export const uploadLabReportSchema = z.object({
  bookingId: z.string().min(1),
  fileKey: fileKey.optional(),
  fileMime: fileMime.optional(),
  fileSize: z.coerce.number().int().min(1).max(50 * 1024 * 1024).optional(),
  summary: z.string().max(2000).optional(),
  abnormal: z.coerce.boolean().default(false),
  parameters: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        value: z.string().min(1).max(80),
        unit: z.string().max(40).optional(),
        range: z.string().max(80).optional(),
        flag: z.enum(["normal", "low", "high", "abnormal"]).default("normal"),
      })
    )
    .optional(),
});

export const requestHomeCareSchema = z.object({
  serviceName: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  scheduledFor: z.string().min(1),
  durationMin: z.coerce.number().int().min(30).max(480).default(60),
  addressLine: z.string().min(3).max(200),
  pricePaisa: z.coerce.number().int().min(0).max(20_000_00),
  paymentMethod: z.enum(["bank_transfer", "card", "jazzcash", "easypaisa", "wallet"]).default("bank_transfer"),
});
export type RequestHomeCareInput = z.infer<typeof requestHomeCareSchema>;

export const assignNurseSchema = z.object({
  requestId: z.string().min(1),
  nurseId: z.string().min(1),
});

export const updateHomeCareStatusSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(["REQUESTED", "ASSIGNED", "EN_ROUTE", "IN_VISIT", "COMPLETED", "CANCELLED"]),
});

export const requestWithdrawalSchema = z.object({
  amountPaisa: z.coerce.number().int().min(50_000), // Rs. 500 minimum
  bankName: z.string().min(2).max(80),
  accountTitle: z.string().min(2).max(120),
  accountNumber: z.string().min(6).max(40),
});
export type RequestWithdrawalInput = z.infer<typeof requestWithdrawalSchema>;

export const decideWithdrawalSchema = z.object({
  withdrawalId: z.string().min(1),
  decision: z.enum(["APPROVE", "REJECT", "PAY", "HOLD"]),
  reason: z.string().max(500).optional(),
});
