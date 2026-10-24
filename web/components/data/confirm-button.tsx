"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Result = { ok: boolean; error?: string };
type Variant = "primary" | "secondary" | "ghost" | "dark" | "accent" | "destructive" | "destructive-outline";
type Size = "sm" | "md" | "lg" | "icon";

/**
 * Generic action button. `action` is a server action passed down from a server
 * component (server actions are the one function type that crosses the RSC
 * boundary); `arg` is its plain-JSON argument. Set `confirmText` to require a
 * two-step confirm (for destructive actions). Refreshes the route on success.
 */
export function ConfirmButton<A>({
  action,
  arg,
  label,
  icon,
  variant = "secondary",
  size = "sm",
  confirmText,
  successMsg = "Done.",
  className,
}: {
  action: (arg: A) => Promise<Result>;
  arg: A;
  label: string;
  icon?: React.ReactNode;
  variant?: Variant;
  size?: Size;
  confirmText?: string;
  successMsg?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [confirming, setConfirming] = React.useState(false);

  const run = () =>
    start(async () => {
      const res = await action(arg);
      if (!res.ok) {
        toast.error(res.error ?? "Something went wrong.");
      } else {
        toast.success(successMsg);
        setConfirming(false);
        router.refresh();
      }
    });

  if (confirmText && confirming) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-[11.5px] text-ge-muted">{confirmText}</span>
        <Button variant="destructive" size={size} loading={pending} onClick={run}>Yes</Button>
        <Button variant="ghost" size={size} onClick={() => setConfirming(false)}>No</Button>
      </span>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      loading={pending && !confirmText}
      onClick={confirmText ? () => setConfirming(true) : run}
    >
      {icon}
      {label}
    </Button>
  );
}
