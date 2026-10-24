import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Downloads a CSV from /api/export/<type>. A plain anchor (full navigation)
 * so the browser honours the Content-Disposition attachment header.
 */
export function ExportButton({ type, label = "Export CSV" }: { type: string; label?: string }) {
  return (
    <Button asChild variant="secondary" size="sm">
      <a href={`/api/export/${type}`} download>
        <Download className="h-3.5 w-3.5" /> {label}
      </a>
    </Button>
  );
}
