// Public storage entrypoint. Pick a provider via STORAGE_PROVIDER env var.

import type { StorageProvider } from "./types";
import { mockStorage } from "./providers/mock";
import { r2Storage } from "./providers/r2";

export type {
  StorageProvider,
  SignedUploadUrl,
  SignedDownloadUrl,
  SignUploadInput,
  SignDownloadInput,
  FileCategory,
} from "./types";

export {
  MAX_BYTES_PER_CATEGORY,
  ALLOWED_MIME_PER_CATEGORY,
  extensionFor,
  isAllowedMime,
  maxBytesFor,
} from "./policy";

export function getStorageProvider(): StorageProvider {
  const name = process.env.STORAGE_PROVIDER ?? "mock";
  switch (name) {
    case "r2": return r2Storage;
    case "mock":
    default:   return mockStorage;
  }
}
