// Zod-validated runtime config for the AI provider.
// Throws a clear, actionable error at first use if a required var is missing.

import { z } from "zod";

const schema = z.object({
  OPENROUTER_API_KEY: z.string().min(20, "OPENROUTER_API_KEY is missing or too short."),
  AI_MODEL: z.string().default("anthropic/claude-sonnet-4"),
  AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(64).max(4096).default(1024),
  AI_TIMEOUT_MS: z.coerce.number().int().min(2000).max(60000).default(30000),
});

let cached: z.infer<typeof schema> | null = null;

export function getAIEnv() {
  if (cached) return cached;
  const parsed = schema.safeParse({
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    AI_MODEL: process.env.AI_MODEL,
    AI_MAX_OUTPUT_TOKENS: process.env.AI_MAX_OUTPUT_TOKENS,
    AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`AI provider env not configured: ${msg}`);
  }
  cached = parsed.data;
  return cached;
}
