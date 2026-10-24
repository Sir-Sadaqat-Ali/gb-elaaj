import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { AI_DISCLAIMER_TEXT } from "@/lib/ai/safety";

export { AI_DISCLAIMER_TEXT, detectEmergency } from "@/lib/ai/safety";

export function AIDisclaimer({ className }: { className?: string }) {
  return (
    <div
      role="note"
      aria-label="AI medical disclaimer"
      className={cn(
        "flex items-start gap-2.5 rounded-md border border-ge-border bg-ge-soft-bg p-3 text-[12px] text-ge-muted",
        className
      )}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ge-primary" aria-hidden />
      <p>{AI_DISCLAIMER_TEXT}</p>
    </div>
  );
}

export function EmergencyBanner({ className }: { className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border border-ge-danger/30 bg-[color:var(--ge-danger-bg)] p-4 text-[13px] text-[color:var(--ge-danger)]",
        className
      )}
    >
      <p className="font-semibold">If this is an emergency, please call 1122 or visit the nearest emergency room immediately.</p>
      <p className="mt-1 text-ge-muted">Aafiyat is not a substitute for emergency medical care.</p>
    </div>
  );
}
