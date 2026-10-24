import type { OcrProvider } from "./types";
import { mockOcr } from "./providers/mock";
import { gcpVisionOcr } from "./providers/gcp-vision";

export type { OcrProvider, OcrResult } from "./types";

export function getOcrProvider(): OcrProvider {
  switch (process.env.OCR_PROVIDER) {
    case "gcp-vision": return gcpVisionOcr;
    case "mock":
    default:           return mockOcr;
  }
}
