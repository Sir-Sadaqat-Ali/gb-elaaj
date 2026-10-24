"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Per-scope error boundary used by every (doctor)/(admin)/(finance)/...
 * `error.tsx`. Keeps the dashboard chrome intact (the layout still renders);
 * only the page content is replaced.
 */
export function ScopeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Forward to Sentry / Axiom in production
    console.error(error);
  }, [error]);

  return (
    <div className="flex justify-center p-6">
      <Card className="w-full max-w-xl p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--ge-danger-bg)] text-[color:var(--ge-danger)]">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="mt-4 ge-display text-[20px] font-semibold text-ge-navy">
          Something went wrong loading this page
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-ge-muted">
          We&apos;ve logged the issue. You can retry, or use the sidebar to navigate to a different page.
        </p>
        {error.digest && (
          <p className="mt-2 text-[10.5px] text-ge-muted">
            Reference: <code className="ge-mono">{error.digest}</code>
          </p>
        )}
        <Button onClick={reset} className="mt-4">
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </Button>
      </Card>
    </div>
  );
}
