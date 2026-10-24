// Mock AI adapter — returns the same templated reply the placeholder route
// used to send. Lets dev work without an OPENROUTER_API_KEY and lets
// AI_PROVIDER=mock serve as a clean rollback path.

import type { AiProvider, ChatInput, AiReply, ChatWithUsageResult } from "../types";
import { AI_DISCLAIMER_TEXT } from "../safety";

function buildBody(lastUserContent: string): string {
  const last = lastUserContent.toLowerCase();
  if (last.includes("appointment")) {
    return [
      "I can help you book an appointment. Tell me the symptom or specialty (e.g., 'I have chest tightness' or 'I need a dermatologist'), and your city.",
      "Once I understand, I'll suggest verified doctors with the soonest open slots.",
    ].join("\n");
  }
  if (last.includes("report") || last.includes("cbc") || last.includes("lab")) {
    return [
      "I can explain lab reports in plain language. Share which test you'd like to discuss (e.g., CBC, Lipid Profile), and I'll walk through what the values typically mean.",
      "",
      "I won't interpret abnormal results as a diagnosis — those need a qualified doctor.",
    ].join("\n");
  }
  return [
    "Thank you for sharing. To help responsibly, I'll need a little more detail: how long has this been going on, and how severe is it on a 1–10 scale?",
    "If symptoms are severe or worsening, please book a consultation right away.",
  ].join("\n");
}

export const mockAi: AiProvider = {
  name: "mock",

  async chat({ messages }: ChatInput): Promise<AiReply> {
    const last = messages[messages.length - 1]?.content ?? "";
    const body = buildBody(last);
    return {
      content: `${body}\n\n${AI_DISCLAIMER_TEXT}`,
      emergency: false,
    };
  },

  async chatWithUsage({ messages }: ChatInput): Promise<ChatWithUsageResult> {
    const last = messages[messages.length - 1]?.content ?? "";
    const body = buildBody(last);
    return {
      reply: { content: `${body}\n\n${AI_DISCLAIMER_TEXT}`, emergency: false },
      usage: { inputTokens: 0, outputTokens: 0, model: "mock" },
    };
  },
};
