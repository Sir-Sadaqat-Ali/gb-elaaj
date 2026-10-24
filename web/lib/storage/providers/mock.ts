// Mock storage adapter — in-memory only. Returns dummy URLs that look real.
// Used when STORAGE_PROVIDER is unset or set to "mock". Default for dev.
//
// In dev, the upload UI sends a real PUT to the dummy URL — that fails silently
// (no server listening at mock.gbelaaj.local). Dev tests should set STORAGE_PROVIDER=mock
// AND mock the fetch in tests, OR point to a local minio/r2-compat dev server.

import type {
  StorageProvider,
  SignedUploadUrl,
  SignedDownloadUrl,
  SignUploadInput,
  SignDownloadInput,
} from "../types";

const memory = new Map<string, { contentType: string; size: number; createdAt: Date }>();

export const mockStorage: StorageProvider = {
  name: "mock",

  async signUpload({ key, contentType, size }: SignUploadInput): Promise<SignedUploadUrl> {
    memory.set(key, { contentType, size, createdAt: new Date() });
    return {
      uploadUrl: `https://mock.gbelaaj.local/upload?key=${encodeURIComponent(key)}`,
      uploadHeaders: { "Content-Type": contentType },
      key,
      size,
      expiresAt: new Date(Date.now() + 5 * 60_000),
    };
  },

  async signDownload({ key, expiresInSeconds = 600 }: SignDownloadInput): Promise<SignedDownloadUrl> {
    return {
      downloadUrl: `https://mock.gbelaaj.local/file?key=${encodeURIComponent(key)}`,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  },

  async upload({ key, contentType, body }: { key: string; contentType: string; body: ArrayBuffer }): Promise<void> {
    memory.set(key, { contentType, size: body.byteLength, createdAt: new Date() });
  },

  async delete(key: string): Promise<void> {
    memory.delete(key);
  },
};
