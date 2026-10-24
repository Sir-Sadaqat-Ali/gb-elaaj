"use client";

import { MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LocationPermissionStateProps = {
  variant: "denied" | "unavailable" | "prompt";
  onRetry?: () => void;
  className?: string;
};

export function LocationPermissionState({
  variant,
  onRetry,
  className,
}: LocationPermissionStateProps) {
  const copy = {
    denied: {
      title: "Location access blocked",
      body: "We can't share your location with the patient because the browser blocked geolocation. Open browser settings, allow location for this site, then click Retry.",
      cta: "Retry",
    },
    unavailable: {
      title: "Location not available",
      body: "Your device couldn't determine its location. Make sure GPS / Wi-Fi is on, then try again.",
      cta: "Try again",
    },
    prompt: {
      title: "Allow location to share with patient",
      body: "We share your live location only during this active visit. It stops automatically when the visit is completed or cancelled.",
      cta: "Allow location",
    },
  } as const;

  const c = copy[variant];
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-start gap-2 rounded-md border border-ge-border bg-ge-soft-bg p-4",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ge-primary/10 text-ge-primary">
          <MapPinOff className="h-3.5 w-3.5" aria-hidden />
        </span>
        <h3 className="text-[13.5px] font-semibold text-ge-ink">{c.title}</h3>
      </div>
      <p className="text-[12px] leading-relaxed text-ge-muted">{c.body}</p>
      {onRetry && (
        <Button size="sm" onClick={onRetry} className="mt-1">
          {c.cta}
        </Button>
      )}
    </div>
  );
}
