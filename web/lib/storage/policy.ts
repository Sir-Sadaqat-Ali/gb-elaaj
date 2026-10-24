// File-category policy: max sizes + MIME allowlists per upload kind.
// Used by /api/uploads/sign (server-side enforcement) and the upload UIs (client-side preview check).
// See STORAGE_AUDIT.md §8.

import type { FileCategory } from "./types";

export const MAX_BYTES_PER_CATEGORY: Record<FileCategory, number> = {
  "lab-report": 10 * 1024 * 1024, // 10 MB
  "prescription": 5 * 1024 * 1024, // 5 MB
  "medical-record": 10 * 1024 * 1024, // 10 MB
  "profile-photo": 2 * 1024 * 1024, // 2 MB
  "pmdc-doc": 5 * 1024 * 1024, // 5 MB
};

export const ALLOWED_MIME_PER_CATEGORY: Record<FileCategory, ReadonlyArray<string>> = {
  "lab-report": ["application/pdf", "image/png", "image/jpeg"],
  "prescription": ["application/pdf", "image/png", "image/jpeg"],
  "medical-record": ["application/pdf", "image/png", "image/jpeg"],
  "profile-photo": ["image/png", "image/jpeg", "image/webp"],
  "pmdc-doc": ["application/pdf", "image/png", "image/jpeg"],
};

export function extensionFor(mime: string): string {
  switch (mime) {
    case "application/pdf": return "pdf";
    case "image/png": return "png";
    case "image/jpeg": return "jpg";
    case "image/webp": return "webp";
    default: return "bin";
  }
}

export function isAllowedMime(category: FileCategory, mime: string): boolean {
  return ALLOWED_MIME_PER_CATEGORY[category].includes(mime);
}

export function maxBytesFor(category: FileCategory): number {
  return MAX_BYTES_PER_CATEGORY[category];
}
