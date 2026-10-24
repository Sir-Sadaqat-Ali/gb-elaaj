// AI provider types — shared across mock + real providers.

export type AiMessage = { role: "user" | "assistant"; content: string };

export type AiReply = {
  content: string;
  emergency: boolean;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
};

export type ChatInput = {
  messages: AiMessage[];
  system: string;
  userId: string;
  maxOutputTokens?: number;
};

export type AiUsage = {
  inputTokens: number;
  outputTokens: number;
  model: string;
};

export type ChatWithUsageResult = {
  reply: AiReply;
  usage: AiUsage;
};

export interface AiProvider {
  readonly name: string;
  chat(input: ChatInput): Promise<AiReply>;
  chatWithUsage?(input: ChatInput): Promise<ChatWithUsageResult>;
}
