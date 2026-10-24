// OpenRouter provider — uses the OpenAI-compatible chat completions API
// pointed at https://openrouter.ai/api/v1.
//
// OpenRouter is a unified gateway: by setting AI_MODEL we can switch
// between Anthropic, OpenAI, Google, etc. without changing client code.
// Default model: anthropic/claude-sonnet-4 (good medical reasoning,
// strong refusal behavior).

import OpenAI from "openai";
import type { AiProvider, ChatInput, AiReply, ChatWithUsageResult } from "../types";
import { getAIEnv } from "../env";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;
  const env = getAIEnv();
  client = new OpenAI({
    apiKey: env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      // OpenRouter docs: these surface in their analytics/leaderboard. ASCII only —
      // HTTP headers can't carry non-ASCII chars, so don't use em-dash here.
      "HTTP-Referer": "https://gb-elaaj.vercel.app",
      "X-Title": "Gb Elaaj - Aafiyat",
    },
    timeout: env.AI_TIMEOUT_MS,
    maxRetries: 1,
  });
  return client;
}

async function callChat(input: ChatInput) {
  const env = getAIEnv();
  const c = getClient();
  return c.chat.completions.create({
    model: env.AI_MODEL,
    max_tokens: input.maxOutputTokens ?? env.AI_MAX_OUTPUT_TOKENS,
    temperature: 0.4, // low — medical context, prefer cautious + consistent
    messages: [
      { role: "system", content: input.system },
      ...input.messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });
}

export const openrouterAi: AiProvider = {
  name: "openrouter",

  async chat(input: ChatInput): Promise<AiReply> {
    const completion = await callChat(input);
    return {
      content: completion.choices[0]?.message?.content ?? "",
      emergency: false,
    };
  },

  async chatWithUsage(input: ChatInput): Promise<ChatWithUsageResult> {
    const completion = await callChat(input);
    const env = getAIEnv();
    return {
      reply: {
        content: completion.choices[0]?.message?.content ?? "",
        emergency: false,
      },
      usage: {
        inputTokens: completion.usage?.prompt_tokens ?? 0,
        outputTokens: completion.usage?.completion_tokens ?? 0,
        model: completion.model ?? env.AI_MODEL,
      },
    };
  },
};
