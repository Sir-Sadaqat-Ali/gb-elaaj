"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <Logo size={32} />
      <p className="mt-6 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ge-danger">Error</p>
      <h1 className="ge-display mt-2 text-3xl font-semibold text-ge-navy">Something went wrong</h1>
      <p className="mt-2 max-w-md text-center text-sm text-ge-muted">
        We&apos;ve logged the issue. Please try again, or contact support if the problem persists.
      </p>
      <div className="mt-5 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="secondary">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </div>
  );
}
