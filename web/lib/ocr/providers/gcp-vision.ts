// GCP Vision OCR adapter — placeholder.
// To activate: GOOGLE_VISION_API_KEY (or GOOGLE_APPLICATION_CREDENTIALS path) +
// pnpm add @google-cloud/vision. Per MOCK_TO_PRODUCTION_MIGRATION_PLAN.md §7.

import type { OcrProvider, OcrResult } from "../types";

export const gcpVisionOcr: OcrProvider = {
  name: "gcp-vision",
  async extract(_): Promise<OcrResult> {
    throw new Error("GCP Vision OCR adapter not yet implemented. Set OCR_PROVIDER=mock.");
  },
};
