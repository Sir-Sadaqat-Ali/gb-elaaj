"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendVerificationEmailAction } from "@/app/(auth)/verify-email/actions";

export function ResendVerifyButton() {
  const [pending, start] = React.useTransition();
  const [sent, setSent] = React.useState(false);
  return (
    <Button
      size="sm"
      variant="secondary"
      loading={pending}
      disabled={sent}
      onClick={() =>
        start(async () => {
          const res = await sendVerificationEmailAction();
          if (!res.ok) toast.error(res.error);
          else {
            toast.success("Verification email sent — check your inbox.");
            setSent(true);
          }
        })
      }
    >
      {sent ? "Email sent" : "Resend email"}
    </Button>
  );
}
