// AI provider switch + re-exports.
// Set AI_PROVIDER=mock for dev (default) or AI_PROVIDER=openrouter for real.

import type { AiProvider } from "./types";
import { mockAi } from "./providers/mock";
import { openrouterAi } from "./providers/openrouter";

export type {
  AiProvider,
  AiMessage,
  AiReply,
  AiUsage,
  ChatInput,
  ChatWithUsageResult,
} from "./types";

export {
  AI_DISCLAIMER_TEXT,
  EMERGENCY_REPLY,
  detectEmergency,
  redactPII,
  sanitizeOutput,
  SYSTEM_PROMPT,
} from "./safety";

export type { SanitizeOutcome } from "./safety";

export function getAiProvider(): AiProvider {
  switch (process.env.AI_PROVIDER) {
    case "openrouter":
      return openrouterAi;
    case "mock":
    default:
      return mockAi;
  }
}
