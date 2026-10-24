import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "lab-report" | "prescription" | "medical-record" | "pmdc-doc";

/**
 * Opens the RBAC-gated, audit-logged download route which 302s to a short-lived
 * signed URL. `id` is the parent record id (LabReport / PharmacyOrder /
 * MedicalRecord / DoctorProfile). A plain anchor is enough — no client JS.
 */
export function FileDownloadButton({
  id,
  kind,
  label = "Download",
  className,
}: {
  id: string;
  kind: Kind;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={`/api/files/${id}/download?kind=${kind}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ge-border bg-white px-3 py-1.5 text-[12.5px] font-medium text-ge-ink transition hover:border-ge-primary hover:text-ge-primary",
        className
      )}
    >
      <Download className="h-3.5 w-3.5" /> {label}
    </a>
  );
}
