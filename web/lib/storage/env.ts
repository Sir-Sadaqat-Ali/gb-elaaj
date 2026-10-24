// Storage env validation. Centralises the var names so providers don't read
// process.env directly (single point to swap or audit).

import { z } from "zod";

const r2EnvSchema = z.object({
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
  R2_BUCKET: z.string().min(1, "R2_BUCKET is required"),
  /**
   * Optional: a public CDN domain you've bound to the bucket.
   * Most code paths use signed URLs, so this is rarely needed.
   * Example: "https://uploads.gbelaaj.pk".
   */
  R2_PUBLIC_BASE_URL: z.string().url().optional(),
});

export type R2Env = z.infer<typeof r2EnvSchema>;

let cached: R2Env | null = null;

/**
 * Reads + validates R2 env vars. Throws a clear, user-facing error if any
 * are missing — caught by /api/uploads/sign and surfaced to the client as
 * "Storage is not configured. Contact support."
 */
export function getR2Env(): R2Env {
  if (cached) return cached;
  const parsed = r2EnvSchema.safeParse({
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET,
    R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
  });
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(
      `R2 env vars missing or invalid: ${fields}. ` +
      `Set STORAGE_PROVIDER=mock for development, or configure R2_ACCOUNT_ID, ` +
      `R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET in Vercel.`,
    );
  }
  cached = parsed.data;
  return cached;
}
