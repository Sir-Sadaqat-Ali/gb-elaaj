// Video env validation. Throws clear error when AGORA_* are missing.

import { z } from "zod";

const agoraEnvSchema = z.object({
  AGORA_APP_ID: z.string().length(32, "AGORA_APP_ID should be 32 hex chars"),
  AGORA_APP_CERTIFICATE: z.string().length(32, "AGORA_APP_CERTIFICATE should be 32 hex chars"),
});

export type AgoraEnv = z.infer<typeof agoraEnvSchema>;

let cached: AgoraEnv | null = null;

export function getAgoraEnv(): AgoraEnv {
  if (cached) return cached;
  const parsed = agoraEnvSchema.safeParse({
    AGORA_APP_ID: process.env.AGORA_APP_ID,
    AGORA_APP_CERTIFICATE: process.env.AGORA_APP_CERTIFICATE,
  });
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(
      `Agora env vars missing or invalid: ${fields}. ` +
      `Set VIDEO_PROVIDER=mock for development, or configure AGORA_APP_ID + AGORA_APP_CERTIFICATE.`,
    );
  }
  cached = parsed.data;
  return cached;
}
