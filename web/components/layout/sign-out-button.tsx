"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/(auth)/signout/actions";

export function SignOutButton() {
  const [pending, start] = React.useTransition();
  return (
    <button
      type="button"
      aria-label="Sign out"
      disabled={pending}
      onClick={() => start(() => signOutAction())}
      className="inline-flex h-7 w-7 items-center justify-center rounded text-ge-muted hover:bg-ge-soft-bg hover:text-ge-ink disabled:opacity-50"
    >
      <LogOut className="h-3.5 w-3.5" />
    </button>
  );
}
