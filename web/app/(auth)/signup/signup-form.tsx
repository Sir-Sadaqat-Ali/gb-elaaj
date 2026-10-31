"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  User,
  Stethoscope,
  HeartHandshake,
  Pill,
  FlaskConical,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
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
import {
  signupAction,
  doctorSignupAction,
  nurseSignupAction,
  pharmacySignupAction,
  labSignupAction,
} from "./actions";

type RoleOption = "PATIENT" | "DOCTOR" | "NURSE" | "PHARMACY" | "LAB";

type Props = {
  cities: { id: string; nameEn: string; slug: string }[];
  specialties: { id: string; nameEn: string; slug: string }[];
};

export function SignupForm({ cities, specialties }: Props) {
  const [selectedRole, setSelectedRole] = React.useState<RoleOption>("PATIENT");
  const [pendingSuccess, setPendingSuccess] = React.useState<{ title: string; message: string; email: string } | null>(null);

  if (pendingSuccess) {
    return (
      <div className="rounded-2xl border border-ge-border bg-white p-7 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h2 className="mt-4 ge-display text-xl font-bold text-ge-navy">{pendingSuccess.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ge-muted">{pendingSuccess.message}</p>
        <div className="mt-5 rounded-lg bg-ge-surface-soft p-3.5 text-xs text-ge-muted">
          Registration submitted for: <strong className="text-ge-navy">{pendingSuccess.email}</strong>. Once our administration team verifies your credentials, your portal access will be unlocked.
        </div>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button asChild variant="secondary">
            <Link href="/">Back to Homepage</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Go to Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Picker */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ge-muted">
          I am registering as:
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <button
            type="button"
            onClick={() => setSelectedRole("PATIENT")}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition ${
              selectedRole === "PATIENT"
                ? "border-ge-primary bg-ge-primary/5 text-ge-primary font-semibold shadow-xs ring-1 ring-ge-primary"
                : "border-ge-border bg-white text-ge-muted hover:border-ge-primary/40 hover:text-ge-ink"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Patient</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("DOCTOR")}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition ${
              selectedRole === "DOCTOR"
                ? "border-ge-primary bg-ge-primary/5 text-ge-primary font-semibold shadow-xs ring-1 ring-ge-primary"
                : "border-ge-border bg-white text-ge-muted hover:border-ge-primary/40 hover:text-ge-ink"
            }`}
          >
            <Stethoscope className="h-4 w-4" />
            <span>Doctor</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("NURSE")}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition ${
              selectedRole === "NURSE"
                ? "border-ge-primary bg-ge-primary/5 text-ge-primary font-semibold shadow-xs ring-1 ring-ge-primary"
                : "border-ge-border bg-white text-ge-muted hover:border-ge-primary/40 hover:text-ge-ink"
            }`}
          >
            <HeartHandshake className="h-4 w-4" />
            <span>Nurse</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("PHARMACY")}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition ${
              selectedRole === "PHARMACY"
                ? "border-ge-primary bg-ge-primary/5 text-ge-primary font-semibold shadow-xs ring-1 ring-ge-primary"
                : "border-ge-border bg-white text-ge-muted hover:border-ge-primary/40 hover:text-ge-ink"
            }`}
          >
            <Pill className="h-4 w-4" />
            <span>Pharmacy</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("LAB")}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition ${
              selectedRole === "LAB"
                ? "border-ge-primary bg-ge-primary/5 text-ge-primary font-semibold shadow-xs ring-1 ring-ge-primary"
                : "border-ge-border bg-white text-ge-muted hover:border-ge-primary/40 hover:text-ge-ink"
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            <span>Lab</span>
          </button>
        </div>
      </div>

      {/* Forms based on Role */}
      {selectedRole === "PATIENT" && <PatientSignupForm />}
      {selectedRole === "DOCTOR" && (
        <DoctorSignupForm
          cities={cities}
          specialties={specialties}
          onSuccess={(email, msg) =>
            setPendingSuccess({
              title: "Doctor Application Received",
              message: msg,
              email,
            })
          }
        />
      )}
      {selectedRole === "NURSE" && (
        <NurseSignupForm
          cities={cities}
          onSuccess={(email, msg) =>
            setPendingSuccess({
              title: "Nurse Application Received",
              message: msg,
              email,
            })
          }
        />
      )}
      {selectedRole === "PHARMACY" && (
        <PharmacySignupForm
          cities={cities}
          onSuccess={(email, msg) =>
            setPendingSuccess({
              title: "Pharmacy Partnership Application Received",
              message: msg,
              email,
            })
          }
        />
      )}
      {selectedRole === "LAB" && (
        <LabSignupForm
          cities={cities}
          onSuccess={(email, msg) =>
            setPendingSuccess({
              title: "Diagnostic Lab Application Received",
              message: msg,
              email,
            })
          }
        />
      )}
    </div>
  );
}

// ── PATIENT FORM ──────────────────────────────────────────────────
function PatientSignupForm() {
  const [pending, startTransition] = React.useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const onSubmit = (values: SignupInput) => {
    startTransition(async () => {
      const res = await signupAction(values);
      if (res && !res.ok) toast.error(res.error);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="rounded-lg bg-blue-50/60 p-3 text-[12.5px] text-blue-900 border border-blue-100 flex items-start gap-2">
        <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <span>Instant patient account to book video appointments, clinics, lab tests and home care.</span>
      </div>

      <Field label="Full name" error={errors.name?.message} required>
        <Input autoComplete="name" placeholder="Sana Yousaf" {...register("name")} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Email address" error={errors.email?.message} required>
          <Input type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
        </Field>
        <Field label="Phone number" error={errors.phone?.message} required hint="e.g. +923111234567">
          <Input type="tel" autoComplete="tel" placeholder="+923111234567" {...register("phone")} />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Password" error={errors.password?.message} required hint="At least 8 characters">
          <Input type="password" autoComplete="new-password" {...register("password")} />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message} required>
          <Input type="password" autoComplete="new-password" {...register("confirmPassword")} />
        </Field>
      </div>
      <label className="flex items-start gap-2 text-[12.5px] text-ge-muted">
        <input type="checkbox" {...register("consent")} className="mt-0.5 accent-ge-primary" />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="text-ge-primary hover:underline">Terms</Link> and{" "}
          <Link href="/privacy" className="text-ge-primary hover:underline">Privacy Policy</Link>.
        </span>
      </label>
      {errors.consent && <p role="alert" className="text-xs text-ge-danger">{errors.consent.message}</p>}
      <Button type="submit" className="w-full" loading={pending}>
        Create Patient Account <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

// ── DOCTOR FORM ───────────────────────────────────────────────────
function DoctorSignupForm({
  cities,
  specialties,
  onSuccess,
}: Props & { onSuccess: (email: string, msg: string) => void }) {
  const [pending, startTransition] = React.useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DoctorSignupInput>({ resolver: zodResolver(doctorSignupSchema) });

  const onSubmit = (values: DoctorSignupInput) => {
    startTransition(async () => {
      const res = await doctorSignupAction(values);
      if (res.ok) {
        toast.success("Application submitted successfully!");
        onSuccess(values.email, res.message ?? "Our medical compliance team will review your credentials.");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="rounded-lg bg-emerald-50/70 p-3 text-[12.5px] text-emerald-900 border border-emerald-100 flex items-start gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <span>
          <strong>PMDC Verified Practice:</strong> All healthcare provider applications are checked against official PMDC registration records before approval.
        </span>
      </div>

      <Field label="Doctor Full Name" error={errors.name?.message} required hint="Include title, e.g. Dr. Tariq Shah">
        <Input placeholder="Dr. Tariq Shah" {...register("name")} />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Email address" error={errors.email?.message} required>
          <Input type="email" placeholder="doctor@example.com" {...register("email")} />
        </Field>
        <Field label="WhatsApp / Phone" error={errors.phone?.message} required hint="e.g. +923001234567">
          <Input type="tel" placeholder="+923001234567" {...register("phone")} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="PMDC / PMC Registration #" error={errors.pmdcNumber?.message} required hint="Official license number">
          <Input placeholder="e.g. 12345-N or PMDC-12345" {...register("pmdcNumber")} />
        </Field>
        <Field label="Medical Qualifications" error={errors.qualifications?.message} required hint="Degrees and fellowships">
          <Input placeholder="MBBS, FCPS Cardiology" {...register("qualifications")} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Primary Specialty" error={errors.specialtyId?.message} required>
          <select
            {...register("specialtyId")}
            className="w-full rounded-md border border-ge-border bg-white px-3 py-2 text-sm shadow-xs focus:border-ge-primary focus:outline-hidden"
          >
            <option value="">Select Specialty</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nameEn}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Practice City / District" error={errors.cityId?.message} required>
          <select
            {...register("cityId")}
            className="w-full rounded-md border border-ge-border bg-white px-3 py-2 text-sm shadow-xs focus:border-ge-primary focus:outline-hidden"
          >
            <option value="">Select City</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Clinic / Hospital Name & Address" error={errors.clinic?.message} required hint="Where you conduct in-person consultations">
        <Input placeholder="Al-Hussaini Medical Complex, Hospital Road, Gilgit" {...register("clinic")} />
      </Field>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Online Fee (PKR)" error={errors.consultFee?.message} required>
          <Input type="number" placeholder="1200" {...register("consultFee")} />
        </Field>
        <Field label="In-Clinic Fee (PKR)" error={errors.clinicFee?.message} required>
          <Input type="number" placeholder="1000" {...register("clinicFee")} />
        </Field>
        <Field label="Experience (Years)" error={errors.experienceYears?.message}>
          <Input type="number" placeholder="5" {...register("experienceYears")} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Password" error={errors.password?.message} required hint="At least 8 characters">
          <Input type="password" {...register("password")} />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message} required>
          <Input type="password" {...register("confirmPassword")} />
        </Field>
      </div>

      <label className="flex items-start gap-2 text-[12.5px] text-ge-muted">
        <input type="checkbox" {...register("consent")} className="mt-0.5 accent-ge-primary" />
        <span>
          I certify that I hold a valid PMDC / PMC license and agree to Gb Elaaj medical provider standards.
        </span>
      </label>
      {errors.consent && <p role="alert" className="text-xs text-ge-danger">{errors.consent.message}</p>}

      <Button type="submit" className="w-full" loading={pending}>
        Submit Doctor Application <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

// ── NURSE FORM ────────────────────────────────────────────────────
function NurseSignupForm({
  cities,
  onSuccess,
}: {
  cities: Props["cities"];
  onSuccess: (email: string, msg: string) => void;
}) {
  const [pending, startTransition] = React.useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NurseSignupInput>({ resolver: zodResolver(nurseSignupSchema) });

  const onSubmit = (values: NurseSignupInput) => {
    startTransition(async () => {
      const res = await nurseSignupAction(values);
      if (res.ok) {
        toast.success("Nurse application submitted!");
        onSuccess(values.email, res.message ?? "Credentials submitted for home care verification.");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="rounded-lg bg-teal-50/70 p-3 text-[12.5px] text-teal-900 border border-teal-100 flex items-start gap-2">
        <HeartHandshake className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
        <span>
          <strong>Home Care & Nursing Staff:</strong> Registered Nurses (RN) and certified assistants are dispatched for home visits upon verification.
        </span>
      </div>

      <Field label="Full Name as per CNIC" error={errors.name?.message} required>
        <Input placeholder="Gulshan Ara" {...register("name")} />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Email address" error={errors.email?.message} required>
          <Input type="email" placeholder="nurse@example.com" {...register("email")} />
        </Field>
        <Field label="WhatsApp Number" error={errors.phone?.message} required hint="Active mobile number">
          <Input type="tel" placeholder="+923421234567" {...register("phone")} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="PNC Card or CNIC Number" error={errors.pncOrCnic?.message} required hint="e.g. 71402-xxxxxxx-x">
          <Input placeholder="71402-xxxxxxx-x" {...register("pncOrCnic")} />
        </Field>
        <Field label="Qualification" error={errors.qualification?.message} required hint="e.g. RN - Registered Nurse">
          <Input placeholder="RN - Registered Nurse" {...register("qualification")} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="City / Region" error={errors.cityId?.message} required>
          <select
            {...register("cityId")}
            className="w-full rounded-md border border-ge-border bg-white px-3 py-2 text-sm shadow-xs focus:border-ge-primary focus:outline-hidden"
          >
            <option value="">Select City</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Nursing Level" required>
          <select
            {...register("level")}
            className="w-full rounded-md border border-ge-border bg-white px-3 py-2 text-sm shadow-xs focus:border-ge-primary focus:outline-hidden"
          >
            <option value="JUNIOR">Junior Nurse / Assistant</option>
            <option value="SENIOR">Senior Nurse (Post RN)</option>
          </select>
        </Field>
      </div>

      <Field label="Residential / Pickup Location" error={errors.address?.message} required hint="For home care dispatch tracking">
        <Input placeholder="Yasin Colony, Jutial, Gilgit" {...register("address")} />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Password" error={errors.password?.message} required hint="At least 8 characters">
          <Input type="password" {...register("password")} />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message} required>
          <Input type="password" {...register("confirmPassword")} />
        </Field>
      </div>

      <label className="flex items-start gap-2 text-[12.5px] text-ge-muted">
        <input type="checkbox" {...register("consent")} className="mt-0.5 accent-ge-primary" />
        <span>I agree to provide authentic nursing care in compliance with healthcare regulations.</span>
      </label>
      {errors.consent && <p role="alert" className="text-xs text-ge-danger">{errors.consent.message}</p>}

      <Button type="submit" className="w-full" loading={pending}>
        Submit Nurse Application <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

// ── PHARMACY FORM ─────────────────────────────────────────────────
function PharmacySignupForm({
  cities,
  onSuccess,
}: {
  cities: Props["cities"];
  onSuccess: (email: string, msg: string) => void;
}) {
  const [pending, startTransition] = React.useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PharmacySignupInput>({ resolver: zodResolver(pharmacySignupSchema) });

  const onSubmit = (values: PharmacySignupInput) => {
    startTransition(async () => {
      const res = await pharmacySignupAction(values);
      if (res.ok) {
        toast.success("Pharmacy registered!");
        onSuccess(values.email, res.message ?? "Submitted for drug regulatory verification.");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="rounded-lg bg-amber-50/70 p-3 text-[12.5px] text-amber-900 border border-amber-100 flex items-start gap-2">
        <Pill className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <span>
          <strong>Licensed Pharmacies:</strong> Connect your retail pharmacy to receive verified digital prescriptions and delivery orders.
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Pharmacy Trade Name" error={errors.pharmacyName?.message} required>
          <Input placeholder="MedCare Pharmacy" {...register("pharmacyName")} />
        </Field>
        <Field label="Owner / In-Charge Pharmacist" error={errors.ownerName?.message} required>
          <Input placeholder="Muhammad Akram" {...register("ownerName")} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Business Email" error={errors.email?.message} required>
          <Input type="email" placeholder="pharmacy@example.com" {...register("email")} />
        </Field>
        <Field label="Contact Phone" error={errors.phone?.message} required>
          <Input type="tel" placeholder="+923451234567" {...register("phone")} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Drug Sale License (DSL) #" error={errors.drugLicense?.message} required hint="Form 9 / 10 License">
          <Input placeholder="DSL-GB-40192" {...register("drugLicense")} />
        </Field>
        <Field label="City" error={errors.cityId?.message} required>
          <select
            {...register("cityId")}
            className="w-full rounded-md border border-ge-border bg-white px-3 py-2 text-sm shadow-xs focus:border-ge-primary focus:outline-hidden"
          >
            <option value="">Select City</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Complete Store Address" error={errors.address?.message} required>
        <Input placeholder="Main KKH Chowk, Danyore, Gilgit" {...register("address")} />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Password" error={errors.password?.message} required hint="At least 8 characters">
          <Input type="password" {...register("password")} />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message} required>
          <Input type="password" {...register("confirmPassword")} />
        </Field>
      </div>

      <label className="flex items-start gap-2 text-[12.5px] text-ge-muted">
        <input type="checkbox" {...register("consent")} className="mt-0.5 accent-ge-primary" />
        <span>I confirm this pharmacy is operating with a valid Drug Sale License under DRAP rules.</span>
      </label>
      {errors.consent && <p role="alert" className="text-xs text-ge-danger">{errors.consent.message}</p>}

      <Button type="submit" className="w-full" loading={pending}>
        Register Pharmacy Partner <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

// ── LAB FORM ──────────────────────────────────────────────────────
function LabSignupForm({
  cities,
  onSuccess,
}: {
  cities: Props["cities"];
  onSuccess: (email: string, msg: string) => void;
}) {
  const [pending, startTransition] = React.useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LabSignupInput>({ resolver: zodResolver(labSignupSchema) });

  const onSubmit = (values: LabSignupInput) => {
    startTransition(async () => {
      const res = await labSignupAction(values);
      if (res.ok) {
        toast.success("Diagnostic lab registered!");
        onSuccess(values.email, res.message ?? "Submitted for clinical lab licensing review.");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="rounded-lg bg-indigo-50/70 p-3 text-[12.5px] text-indigo-900 border border-indigo-100 flex items-start gap-2">
        <FlaskConical className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
        <span>
          <strong>Diagnostic Laboratories:</strong> Partner to accept home sample collection bookings and deliver online reports to patients.
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Laboratory Name" error={errors.labName?.message} required>
          <Input placeholder="Gilgit Diagnostic Center" {...register("labName")} />
        </Field>
        <Field label="Pathologist / Director Name" error={errors.directorName?.message} required>
          <Input placeholder="Dr. Sadiq Ali" {...register("directorName")} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Official Email" error={errors.email?.message} required>
          <Input type="email" placeholder="lab@example.com" {...register("email")} />
        </Field>
        <Field label="Contact Phone" error={errors.phone?.message} required>
          <Input type="tel" placeholder="+923161234567" {...register("phone")} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Healthcare Commission License #" error={errors.labLicense?.message} required hint="Clinical lab registration">
          <Input placeholder="HCC-LAB-9921" {...register("labLicense")} />
        </Field>
        <Field label="City" error={errors.cityId?.message} required>
          <select
            {...register("cityId")}
            className="w-full rounded-md border border-ge-border bg-white px-3 py-2 text-sm shadow-xs focus:border-ge-primary focus:outline-hidden"
          >
            <option value="">Select City</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Laboratory Facility Address" error={errors.address?.message} required>
        <Input placeholder="Hospital Road, near District Hospital, Gilgit" {...register("address")} />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Password" error={errors.password?.message} required hint="At least 8 characters">
          <Input type="password" {...register("password")} />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message} required>
          <Input type="password" {...register("confirmPassword")} />
        </Field>
      </div>

      <label className="flex items-start gap-2 text-[12.5px] text-ge-muted">
        <input type="checkbox" {...register("consent")} className="mt-0.5 accent-ge-primary" />
        <span>I confirm this facility meets clinical diagnostic safety standards.</span>
      </label>
      {errors.consent && <p role="alert" className="text-xs text-ge-danger">{errors.consent.message}</p>}

      <Button type="submit" className="w-full" loading={pending}>
        Register Diagnostic Lab <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
