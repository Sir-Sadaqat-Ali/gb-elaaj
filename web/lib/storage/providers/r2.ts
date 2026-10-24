// Cloudflare R2 storage adapter. Uses the AWS SDK because R2 is S3-compatible.
//
// Cloudflare R2 endpoint pattern:
//   https://<accountId>.r2.cloudflarestorage.com
//
// Signed URL discipline:
//   - PUT URLs are short-lived (5 minutes) and bind to a specific
//     Content-Type and Content-Length to prevent over-large uploads.
//   - GET URLs are short-lived (10 minutes by default).
//
// Bucket policy required (manual one-time setup in R2 dashboard):
//   - Block all public access — never make the bucket public
//   - CORS allowing PUT from your app origin

import { S3Client, DeleteObjectCommand, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  StorageProvider,
  SignedUploadUrl,
  SignedDownloadUrl,
  SignUploadInput,
  SignDownloadInput,
} from "../types";
import { getR2Env } from "../env";

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  const env = getR2Env();
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
    // Required for R2 — AWS SDK v3.700+ enabled flexible-checksums by default
    // (adds x-amz-checksum-crc32 query param to signed URLs). R2's signature
    // verifier rejects those params → presigned PUTs fail with 403.
    // WHEN_REQUIRED keeps the SDK from adding checksum metadata unless we ask.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return cachedClient;
}

export const r2Storage: StorageProvider = {
  name: "r2",

  async signUpload({ key, contentType, size }: SignUploadInput): Promise<SignedUploadUrl> {
    const env = getR2Env();
    const client = getClient();

    // Pre-sign a PUT. Binding ContentType + ContentLength means the browser's
    // PUT must match exactly — R2 rejects otherwise. This prevents both
    // type spoofing AND size spoofing (caller can't claim 1 KB then upload 1 GB).
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });

    const expiresInSeconds = 5 * 60; // 5 min
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

    return {
      uploadUrl,
      uploadHeaders: {
        "Content-Type": contentType,
      },
      key,
      size,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  },

  async signDownload({ key, expiresInSeconds = 600 }: SignDownloadInput): Promise<SignedDownloadUrl> {
    const env = getR2Env();
    const client = getClient();
    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
    });
    const downloadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
    return {
      downloadUrl,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  },

  async upload({ key, contentType, body }: { key: string; contentType: string; body: ArrayBuffer }): Promise<void> {
    const env = getR2Env();
    const client = getClient();
    await client.send(new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      ContentType: contentType,
      Body: new Uint8Array(body),
      ContentLength: body.byteLength,
    }));
  },

  async delete(key: string): Promise<void> {
    const env = getR2Env();
    const client = getClient();
    await client.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
  },
};
