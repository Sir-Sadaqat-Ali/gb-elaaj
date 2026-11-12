// Video env validation. Falls back to verified production Agora credentials if Vercel env vars are not set.

import { z } from "zod";

const DEFAULT_AGORA_APP_ID = "07ddb4448762404f8c1d0310edc8a18d";
const DEFAULT_AGORA_APP_CERTIFICATE = "89e7a3698190429dbd6beb8d3df17b78";

const agoraEnvSchema = z.object({
  AGORA_APP_ID: z.string().length(32, "AGORA_APP_ID should be 32 hex chars"),
  AGORA_APP_CERTIFICATE: z.string().length(32, "AGORA_APP_CERTIFICATE should be 32 hex chars"),
});

export type AgoraEnv = z.infer<typeof agoraEnvSchema>;

let cached: AgoraEnv | null = null;

export function getAgoraEnv(): AgoraEnv {
  if (cached) return cached;
  const rawAppId = (process.env.AGORA_APP_ID || "").trim() || DEFAULT_AGORA_APP_ID;
  const rawAppCert = (process.env.AGORA_APP_CERTIFICATE || "").trim() || DEFAULT_AGORA_APP_CERTIFICATE;

  const parsed = agoraEnvSchema.safeParse({
    AGORA_APP_ID: rawAppId,
    AGORA_APP_CERTIFICATE: rawAppCert,
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
