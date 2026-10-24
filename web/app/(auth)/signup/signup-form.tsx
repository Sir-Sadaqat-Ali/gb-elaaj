"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { signupSchema, type SignupInput } from "@/lib/validation/auth";
import { signupAction } from "./actions";

export function SignupForm() {
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
      <Field label="Full name" error={errors.name?.message} required>
        <Input autoComplete="name" placeholder="Sana Yousaf" {...register("name")} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Email" error={errors.email?.message} required>
          <Input type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
        </Field>
        <Field label="Phone" error={errors.phone?.message} required hint="Pakistan number, e.g. +923xx-xxxxxxx">
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
          <a href="/terms" className="text-ge-primary hover:underline">Terms</a> and{" "}
          <a href="/privacy" className="text-ge-primary hover:underline">Privacy Policy</a>.
        </span>
      </label>
      {errors.consent && <p role="alert" className="text-xs text-ge-danger">{errors.consent.message}</p>}
      <Button type="submit" className="w-full" loading={pending}>
        Create account <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
