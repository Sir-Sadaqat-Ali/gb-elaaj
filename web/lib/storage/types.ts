// Storage provider contract — same shape for R2, S3, Supabase, mock.
// See lib/providers/README.md for the abstraction pattern.

/**
 * File category. Drives:
 *  - storage key prefix
 *  - max upload size
 *  - allowed MIME types
 *  - RBAC rules in /api/files/[id]/download
 */
export type FileCategory =
  | "lab-report"
  | "prescription"
  | "medical-record"
  | "profile-photo"
  | "pmdc-doc";

export type SignedUploadUrl = {
  uploadUrl: string;
  /**
   * Headers the browser MUST include in the PUT request.
   * Always at least `Content-Type` matching what was signed.
   */
  uploadHeaders: Record<string, string>;
  /** Storage key — store this in DB after the upload completes successfully. */
  key: string;
  /** Exact bytes the signed URL accepts (matches the PUT request's Content-Length). */
  size: number;
  expiresAt: Date;
};

export type SignedDownloadUrl = {
  downloadUrl: string;
  expiresAt: Date;
};

export type SignUploadInput = {
  /** Pre-built key (caller chooses scheme — typically `<category>/<userId>/<uuid>.<ext>`) */
  key: string;
  contentType: string;
  /** Exact byte count the client will upload (must match Content-Length on the PUT). */
  size: number;
};

export type SignDownloadInput = {
  key: string;
  /** Optional override for short-lived URL (default 600s). */
  expiresInSeconds?: number;
};

export type UploadObjectInput = {
  key: string;
  contentType: string;
  body: ArrayBuffer;
};

export interface StorageProvider {
  readonly name: string;
  signUpload(input: SignUploadInput): Promise<SignedUploadUrl>;
  signDownload(input: SignDownloadInput): Promise<SignedDownloadUrl>;
  upload(input: UploadObjectInput): Promise<void>;
  delete(key: string): Promise<void>;
}
