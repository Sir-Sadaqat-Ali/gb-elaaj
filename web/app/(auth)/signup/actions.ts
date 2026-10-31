"use server";

import { redirect } from "next/navigation";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { Role, UserStatus, DoctorVerificationStatus } from "@prisma/client";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  signupSchema,
  type SignupInput,
  doctorSignupSchema,
  type DoctorSignupInput,
  nurseSignupSchema,
  type NurseSignupInput,
  pharmacySignupSchema,
  type PharmacySignupInput,
  labSignupSchema,
  type LabSignupInput,
} from "@/lib/validation/auth";
import { ROLE_HOME } from "@/lib/auth.config";
import { dispatchNotification } from "@/lib/notifications/dispatch";

export type SignupActionResult = { ok: true; pendingApproval?: boolean; message?: string } | { ok: false; error: string };

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const BCRYPT_COST = 12;

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}-${randomBytes(3).toString("hex")}`;
}

// ── 1. PATIENT SIGNUP ACTION ──────────────────────────────────────
export async function signupAction(input: SignupInput): Promise<SignupActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (existing) {
    return { ok: false, error: "An account with this email or phone already exists." };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const verifyPlain = randomBytes(32).toString("base64url");
  const verifyHash = createHash("sha256").update(verifyPlain).digest("hex");

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: Role.PATIENT,
      status: UserStatus.ACTIVE,
      emailVerifyTokenHash: verifyHash,
      emailVerifyExpires: new Date(Date.now() + VERIFY_TTL_MS),
      patient: { create: {} },
    },
  });

  dispatchNotification({
    userId: user.id,
    template: "auth.email-verify",
    data: { token: verifyPlain, name },
    email: true,
  }).catch((e) => console.error("[signup] verification email dispatch failed:", e));

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    redirect("/login");
  }
  redirect(ROLE_HOME.PATIENT);
}

// ── 2. DOCTOR REGISTRATION ACTION ─────────────────────────────────
export async function doctorSignupAction(input: DoctorSignupInput): Promise<SignupActionResult> {
  const parsed = doctorSignupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
  const d = parsed.data;

  const existingUser = await prisma.user.findFirst({ where: { OR: [{ email: d.email }, { phone: d.phone }] } });
  if (existingUser) {
    return { ok: false, error: "An account with this email or phone number already exists." };
  }

  const existingPmdc = await prisma.doctorProfile.findUnique({ where: { pmdcNumber: d.pmdcNumber } });
  if (existingPmdc) {
    return { ok: false, error: "A doctor with this PMDC / PMC number is already registered." };
  }

  const passwordHash = await bcrypt.hash(d.password, BCRYPT_COST);
  const slug = slugify(d.name);

  const specialty = await prisma.specialty.findUnique({ where: { id: d.specialtyId } });
  const bio = `${d.name} is a specialist in ${specialty?.nameEn ?? "Medical Care"} with ${d.experienceYears} years experience, practicing at ${d.clinic}.`;

  const user = await prisma.user.create({
    data: {
      name: d.name,
      email: d.email,
      phone: d.phone,
      passwordHash,
      role: Role.DOCTOR,
      status: UserStatus.PENDING_VERIFICATION,
      doctor: {
        create: {
          slug,
          pmdcNumber: d.pmdcNumber,
          qualifications: d.qualifications,
          bioEn: bio,
          experienceYears: d.experienceYears,
          consultFeePaisa: Math.round(d.consultFee * 100),
          clinicFeePaisa: Math.round(d.clinicFee * 100),
          cityId: d.cityId,
          clinic: d.clinic,
          modes: ["VIDEO", "CLINIC"],
          verifiedStatus: DoctorVerificationStatus.PENDING,
          active: false,
          specialties: {
            create: [{ specialtyId: d.specialtyId }],
          },
        },
      },
    },
  });

  return {
    ok: true,
    pendingApproval: true,
    message: "Doctor registration submitted successfully! Our medical board will verify your PMDC registration within 24 hours.",
  };
}

// ── 3. NURSE REGISTRATION ACTION ──────────────────────────────────
export async function nurseSignupAction(input: NurseSignupInput): Promise<SignupActionResult> {
  const parsed = nurseSignupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
  const d = parsed.data;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email: d.email }, { phone: d.phone }] } });
  if (existing) {
    return { ok: false, error: "An account with this email or phone number already exists." };
  }

  const passwordHash = await bcrypt.hash(d.password, BCRYPT_COST);

  await prisma.user.create({
    data: {
      name: d.name,
      email: d.email,
      phone: d.phone,
      passwordHash,
      role: Role.NURSE,
      status: UserStatus.PENDING_VERIFICATION,
      nurseProfile: {
        create: {
          level: d.level,
          cityId: d.cityId,
          verified: false,
          active: false,
        },
      },
    },
  });

  return {
    ok: true,
    pendingApproval: true,
    message: "Nurse application submitted successfully! Our team will verify your PNC / Nursing credentials before activating your home care account.",
  };
}

// ── 4. PHARMACY REGISTRATION ACTION ───────────────────────────────
export async function pharmacySignupAction(input: PharmacySignupInput): Promise<SignupActionResult> {
  const parsed = pharmacySignupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
  const d = parsed.data;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email: d.email }, { phone: d.phone }] } });
  if (existing) {
    return { ok: false, error: "An account with this email or phone number already exists." };
  }

  const existingLicense = await prisma.pharmacy.findUnique({ where: { license: d.drugLicense } });
  if (existingLicense) {
    return { ok: false, error: "A pharmacy with this Drug Sale License is already registered." };
  }

  const passwordHash = await bcrypt.hash(d.password, BCRYPT_COST);
  const slug = slugify(d.pharmacyName);

  await prisma.user.create({
    data: {
      name: d.ownerName,
      email: d.email,
      phone: d.phone,
      passwordHash,
      role: Role.PHARMACY_ADMIN,
      status: UserStatus.PENDING_VERIFICATION,
      pharmacyAdmin: {
        create: {
          name: d.pharmacyName,
          slug,
          cityId: d.cityId,
          license: d.drugLicense,
          verified: false,
          active: false,
        },
      },
    },
  });

  return {
    ok: true,
    pendingApproval: true,
    message: "Pharmacy registration submitted successfully! Our pharmacy compliance team will verify your Drug Sale License within 24 hours.",
  };
}

// ── 5. DIAGNOSTIC LAB REGISTRATION ACTION ─────────────────────────
export async function labSignupAction(input: LabSignupInput): Promise<SignupActionResult> {
  const parsed = labSignupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
  const d = parsed.data;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email: d.email }, { phone: d.phone }] } });
  if (existing) {
    return { ok: false, error: "An account with this email or phone number already exists." };
  }

  const existingLicense = await prisma.lab.findUnique({ where: { license: d.labLicense } });
  if (existingLicense) {
    return { ok: false, error: "A diagnostic lab with this license is already registered." };
  }

  const passwordHash = await bcrypt.hash(d.password, BCRYPT_COST);
  const slug = slugify(d.labName);

  await prisma.user.create({
    data: {
      name: d.directorName,
      email: d.email,
      phone: d.phone,
      passwordHash,
      role: Role.LAB_ADMIN,
      status: UserStatus.PENDING_VERIFICATION,
      labAdmin: {
        create: {
          name: d.labName,
          slug,
          cityId: d.cityId,
          license: d.labLicense,
          verified: false,
          active: false,
        },
      },
    },
  });

  return {
    ok: true,
    pendingApproval: true,
    message: "Diagnostic lab registration submitted! Our medical team will verify your healthcare license within 24 hours.",
  };
}
