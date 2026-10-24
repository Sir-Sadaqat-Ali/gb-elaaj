"use client";

import * as React from "react";
import { toast } from "sonner";
import { Upload, FileCheck2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type UploadResult = {
  fileKey: string;
  fileMime: string;
  fileSize: number;
  fileName: string;
};

type Category = "lab-report" | "prescription" | "medical-record" | "profile-photo" | "pmdc-doc";

type Props = {
  category: Category;
  /** Tells parent what was uploaded so it can include the key in its server action call. */
  onUploaded: (result: UploadResult) => void;
  /** Reset state — set null to clear the picker. */
  value?: UploadResult | null;
  label?: string;
  hint?: string;
  className?: string;
  disabled?: boolean;
};

const ACCEPT: Record<Category, string> = {
  "lab-report": "application/pdf,image/png,image/jpeg",
  "prescription": "application/pdf,image/png,image/jpeg",
  "medical-record": "application/pdf,image/png,image/jpeg",
  "profile-photo": "image/png,image/jpeg,image/webp",
  "pmdc-doc": "application/pdf,image/png,image/jpeg",
};

const MAX_MB: Record<Category, number> = {
  "lab-report": 10,
  "prescription": 5,
  "medical-record": 10,
  "profile-photo": 2,
  "pmdc-doc": 5,
};

export function UploadField({ category, onUploaded, value, label, hint, className, disabled }: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = React.useState(false);
  const accept = ACCEPT[category];
  const maxMB = MAX_MB[category];

  async function handlePick(file: File) {
    setPending(true);
    try {
      // 1. Client-side preflight — friendly errors
      if (!accept.split(",").includes(file.type)) {
        toast.error(`File type "${file.type || "unknown"}" not allowed. Use ${accept.split(",").join(", ")}.`);
        return;
      }
      if (file.size > maxMB * 1024 * 1024) {
        toast.error(`File is too large. Maximum ${maxMB} MB.`);
        return;
      }

      let uploaded: UploadResult;
      if (category === "profile-photo") {
        const body = new FormData();
        body.append("file", file);
        const uploadResp = await fetch("/api/uploads/profile-photo", { method: "POST", body });
        const uploadedJson = await uploadResp.json();
        if (!uploadResp.ok || !uploadedJson.ok) {
          toast.error(uploadedJson.error ?? "Could not upload profile picture.");
          return;
        }
        uploaded = uploadedJson.data;
      } else {
        // 2. Get signed PUT URL
        const signResp = await fetch("/api/uploads/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category, contentType: file.type, size: file.size }),
        });
        const signed = await signResp.json();
        if (!signResp.ok || !signed.ok) {
          toast.error(signed.error ?? "Could not start upload.");
          return;
        }

        // 3. PUT directly to storage
        const putResp = await fetch(signed.data.uploadUrl, {
          method: "PUT",
          headers: signed.data.uploadHeaders,
          body: file,
        });
        if (!putResp.ok) {
          toast.error("Upload failed. Please try again.");
          return;
        }
        uploaded = { fileKey: signed.data.key, fileMime: file.type, fileSize: file.size, fileName: file.name };
      }

      // 4. Tell parent
      onUploaded(uploaded);
      toast.success("File uploaded.");
    } catch (e) {
      toast.error("Upload failed. Please try again.");
      console.error("[UploadField] error:", e);
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      {label && <div className="mb-1.5 text-[12px] font-medium text-ge-ink">{label}</div>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handlePick(f);
        }}
        disabled={disabled || pending}
      />
      {value ? (
        <div className="flex items-center gap-2 rounded-md border border-ge-success/40 bg-ge-success/5 px-3 py-2">
          <FileCheck2 className="h-4 w-4 text-ge-success" />
          <span className="flex-1 truncate text-[13px] text-ge-ink">{value.fileName}</span>
          <span className="ge-mono text-[11px] text-ge-muted">
            {(value.fileSize / 1024).toFixed(0)} KB
          </span>
          <button
            type="button"
            className="text-ge-muted hover:text-ge-danger"
            onClick={() => onUploaded({ ...value, fileKey: "", fileMime: "", fileSize: 0, fileName: "" })}
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || pending}
          className="w-full justify-start"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Choose file (max {maxMB} MB)
            </>
          )}
        </Button>
      )}
      {hint && <p className="mt-1 text-[11.5px] text-ge-muted">{hint}</p>}
    </div>
  );
}
