import { z } from "zod";

export const bookAppointmentSchema = z.object({
  doctorSlug: z.string().min(1),
  slotId: z.string().min(1),
  symptoms: z.string().max(2000).optional(),
  paymentMethod: z.enum(["bank_transfer", "card", "jazzcash", "easypaisa", "wallet"]).default("bank_transfer"),
});
export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export const completeAppointmentSchema = z.object({
  appointmentId: z.string().min(1),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().min(1),
  newSlotId: z.string().min(1),
});

export const reviewSchema = z.object({
  appointmentId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(2000).optional(),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

export const doctorScheduleSchema = z.object({
  startDate: z.string(),  // ISO yyyy-mm-dd
  days: z.coerce.number().int().min(1).max(14),
  startHour: z.coerce.number().int().min(0).max(22),
  endHour: z.coerce.number().int().min(1).max(23),
  slotMinutes: z.coerce.number().int().min(10).max(60),
  mode: z.enum(["VIDEO", "CLINIC"]),
});

export const prescriptionSchema = z.object({
  appointmentId: z.string().min(1),
  diagnosis: z.string().min(1).max(1000),
  notes: z.string().max(2000).optional(),
  lines: z
    .array(
      z.object({
        drug: z.string().min(1).max(200),
        strength: z.string().max(100).optional(),
        frequency: z.string().min(1).max(200),
        durationDays: z.coerce.number().int().min(1).max(365),
        notes: z.string().max(500).optional(),
      })
    )
    .min(1, "Add at least one medication"),
});
export type PrescriptionInput = z.infer<typeof prescriptionSchema>;

export const verificationDecisionSchema = z.object({
  doctorId: z.string().min(1),
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().max(500).optional(),
});
