"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { loginAction } from "./actions";

export function LoginForm({ next, error }: { next?: string; error?: string }) {
  const [pending, startTransition] = React.useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  React.useEffect(() => {
    if (error) toast.error(decodeURIComponent(error));
  }, [error]);

  const onSubmit = (values: LoginInput) => {
    startTransition(async () => {
      const res = await loginAction({ ...values, next });
      // On success, loginAction throws NEXT_REDIRECT and we never reach here.
      if (res && !res.ok) {
        toast.error(res.error);
      }
    });
  };

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
      <Field label="Password" error={errors.password?.message}>
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...register("password")}
        />
      </Field>
      <Button type="submit" className="w-full" loading={pending}>
        Sign in <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
