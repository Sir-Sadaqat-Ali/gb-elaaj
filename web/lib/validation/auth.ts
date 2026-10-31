import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ── 1. Patient Signup Schema ──────────────────────────────────────
export const signupSchema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email"),
    phone: z
      .string()
      .min(10, "Enter a valid phone number")
      .regex(/^[+0-9 \-]+$/, "Phone may contain digits, spaces, +, -"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
    consent: z.literal(true, { errorMap: () => ({ message: "Please accept the terms" }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type SignupInput = z.infer<typeof signupSchema>;

// ── 2. Doctor Signup Schema ───────────────────────────────────────
export const doctorSignupSchema = z
  .object({
    name: z.string().min(2, "Enter full doctor name (e.g. Dr. Tariq)"),
    email: z.string().email("Enter a valid email"),
    phone: z
      .string()
      .min(10, "Enter a valid phone number")
      .regex(/^[+0-9 \-]+$/, "Phone may contain digits, spaces, +, -"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
    pmdcNumber: z.string().min(3, "PMDC / PMC Registration number is required for verification"),
    qualifications: z.string().min(2, "Enter medical qualifications (e.g. MBBS, FCPS)"),
    specialtyId: z.string().min(1, "Please select your primary specialty"),
    cityId: z.string().min(1, "Please select your primary city"),
    clinic: z.string().min(3, "Enter hospital or clinic name & address"),
    consultFee: z.coerce.number().min(0, "Enter valid online fee in PKR"),
    clinicFee: z.coerce.number().min(0, "Enter valid in-clinic fee in PKR"),
    experienceYears: z.coerce.number().min(0).max(60).default(3),
    consent: z.literal(true, { errorMap: () => ({ message: "Please accept the medical provider terms" }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type DoctorSignupInput = z.infer<typeof doctorSignupSchema>;

// ── 3. Nurse Signup Schema ────────────────────────────────────────
export const nurseSignupSchema = z
  .object({
    name: z.string().min(2, "Enter full nurse name"),
    email: z.string().email("Enter a valid email"),
    phone: z
      .string()
      .min(10, "Enter a valid phone number")
      .regex(/^[+0-9 \-]+$/, "Phone may contain digits, spaces, +, -"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
    pncOrCnic: z.string().min(5, "PNC Card or CNIC number is required"),
    qualification: z.string().min(2, "Enter qualification (e.g. RN - Registered Nurse)"),
    level: z.enum(["JUNIOR", "SENIOR"]).default("JUNIOR"),
    cityId: z.string().min(1, "Please select city"),
    address: z.string().min(3, "Enter residential / dispatch location"),
    consent: z.literal(true, { errorMap: () => ({ message: "Please accept the home care provider terms" }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type NurseSignupInput = z.infer<typeof nurseSignupSchema>;

// ── 4. Pharmacy Signup Schema ─────────────────────────────────────
export const pharmacySignupSchema = z
  .object({
    pharmacyName: z.string().min(2, "Enter official pharmacy name"),
    ownerName: z.string().min(2, "Enter owner / pharmacist-in-charge name"),
    email: z.string().email("Enter a valid email"),
    phone: z
      .string()
      .min(10, "Enter a valid phone number")
      .regex(/^[+0-9 \-]+$/, "Phone may contain digits, spaces, +, -"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
    drugLicense: z.string().min(3, "Drug Sale License (Form 9/10/11) is required"),
    cityId: z.string().min(1, "Please select city"),
    address: z.string().min(3, "Enter complete pharmacy address"),
    consent: z.literal(true, { errorMap: () => ({ message: "Please accept the pharmacy partner terms" }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type PharmacySignupInput = z.infer<typeof pharmacySignupSchema>;

// ── 5. Diagnostic Lab Signup Schema ───────────────────────────────
export const labSignupSchema = z
  .object({
    labName: z.string().min(2, "Enter official diagnostic lab name"),
    directorName: z.string().min(2, "Enter pathologist / director name"),
    email: z.string().email("Enter a valid email"),
    phone: z
      .string()
      .min(10, "Enter a valid phone number")
      .regex(/^[+0-9 \-]+$/, "Phone may contain digits, spaces, +, -"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
    labLicense: z.string().min(3, "Clinical Lab / Healthcare Commission license number is required"),
    cityId: z.string().min(1, "Please select city"),
    address: z.string().min(3, "Enter laboratory address"),
    consent: z.literal(true, { errorMap: () => ({ message: "Please accept the laboratory partner terms" }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type LabSignupInput = z.infer<typeof labSignupSchema>;

// ── Forgot & Reset Password ───────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20, "Invalid reset link"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
