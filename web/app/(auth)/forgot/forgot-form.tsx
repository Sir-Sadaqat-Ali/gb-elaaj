"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth";
import { requestPasswordResetAction } from "./actions";

export function ForgotPasswordForm() {
  const [pending, startTransition] = React.useTransition();
  const [sent, setSent] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = (values: ForgotPasswordInput) => {
    startTransition(async () => {
      const res = await requestPasswordResetAction(values);
      if (res.ok) {
        setSent(true);
        toast.success(res.message ?? "Check your inbox.");
      } else {
        toast.error(res.error);
      }
    });
  };

  if (sent) {
    return (
      <div className="rounded-lg border border-ge-border bg-ge-soft-bg p-4 text-[13.5px] text-ge-ink">
        If that email is registered, a password reset link is on the way. The link expires in 1 hour.
        <p className="mt-2 text-[12px] text-ge-muted">
          Didn&apos;t receive it after a few minutes? Check spam, or try another email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Email" error={errors.email?.message}>
        <Input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register("email")}
        />
      </Field>
      <Button type="submit" className="w-full" loading={pending}>
        Send reset link <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
