import type { OcrProvider, OcrResult } from "../types";

export const mockOcr: OcrProvider = {
  name: "mock",
  async extract(_): Promise<OcrResult> {
    return {
      text: "[mock OCR output — wire GCP Vision per MOCK_TO_PRODUCTION_MIGRATION_PLAN.md §7]",
      confidence: 0,
    };
  },
};
