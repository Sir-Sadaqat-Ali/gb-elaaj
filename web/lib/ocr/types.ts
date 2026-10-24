export type OcrResult = {
  text: string;
  confidence: number;       // 0-1
  pages?: Array<{ pageNumber: number; text: string; confidence: number }>;
  structuredData?: Record<string, unknown>;
};

export interface OcrProvider {
  readonly name: string;
  extract(input: { fileKey: string; mimeType: string }): Promise<OcrResult>;
}
