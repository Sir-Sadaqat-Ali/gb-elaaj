// POST /api/uploads/sign
//
// Issues a short-lived (5 min) presigned PUT URL for the configured storage
// provider. The browser uploads directly to that URL — the file never touches
// our server.
//
// Security:
// - Auth required
// - Per-category role gate
// - Server-side MIME + size enforcement (also baked into the signed URL)
// - Storage key follows <category>/<userId>/<uuid>.<ext> — predictable shape,
//   not user-controlled

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  getStorageProvider,
  isAllowedMime,
  maxBytesFor,
  extensionFor,
  ALLOWED_MIME_PER_CATEGORY,
  MAX_BYTES_PER_CATEGORY,
  type FileCategory,
} from "@/lib/storage";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({
  category: z.enum(["lab-report", "prescription", "medical-record", "profile-photo", "pmdc-doc"]),
  contentType: z.string().min(1).max(100),
  /**
   * Exact byte count the client will upload. Required because we embed it in
   * Content-Length on the signed URL — R2 rejects if PUT body size differs.
   * This stops a caller from claiming 1 KB then uploading 1 GB.
   */
  size: z.number().int().positive().max(50 * 1024 * 1024),
});

/**
 * Per-category role gate. Returns true if the caller may upload that kind.
 */
function canUpload(role: Role, category: FileCategory): boolean {
  switch (category) {
    case "lab-report":
      return role === Role.LAB_ADMIN || role === Role.ADMIN;
    case "prescription":
      // Patients upload Rx for orders; pharmacy admins can upload on patient's behalf in support flows
      return role === Role.PATIENT || role === Role.PHARMACY_ADMIN || role === Role.ADMIN;
    case "medical-record":
      // Patients upload their own documents; the key is namespaced by userId and
      // the record they attach it to is ownership-checked in addPatientDocumentAction.
      return role === Role.PATIENT || role === Role.DOCTOR || role === Role.LAB_ADMIN || role === Role.ADMIN;
    case "profile-photo":
      // Any authed user can upload their own profile photo
      return true;
    case "pmdc-doc":
      // Doctor uploads their own; admin reviews
      return role === Role.DOCTOR || role === Role.ADMIN;
    default:
      return false;
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, error: "Please sign in to upload files." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid input. Provide category, contentType, and (optional) size." },
      { status: 400 },
    );
  }
  const { category, contentType, size } = parsed.data;

  // Role gate
  if (!canUpload(session.user.role, category)) {
    return NextResponse.json(
      { ok: false, error: `Your role cannot upload ${category} files.` },
      { status: 403 },
    );
  }

  // MIME allowlist
  if (!isAllowedMime(category, contentType)) {
    const allowed = ALLOWED_MIME_PER_CATEGORY[category].join(", ");
    return NextResponse.json(
      { ok: false, error: `File type not allowed for ${category}. Allowed: ${allowed}.` },
      { status: 400 },
    );
  }

  // Size cap (client-claimed; final enforcement is by R2 via ContentLength)
  const maxSize = maxBytesFor(category);
  if (size != null && size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return NextResponse.json(
      { ok: false, error: `File too large. Max ${maxMB} MB for ${category}.` },
      { status: 400 },
    );
  }

  // Build the storage key. Format: <category>/<userId>/<uuid>.<ext>
  const ext = extensionFor(contentType);
  const uuid = crypto.randomUUID();
  const key = `${category}/${session.user.id}/${uuid}.${ext}`;

  try {
    const provider = getStorageProvider();
    const signed = await provider.signUpload({
      key,
      contentType,
      size,
    });
    return NextResponse.json(
      {
        ok: true,
        data: {
          uploadUrl: signed.uploadUrl,
          uploadHeaders: signed.uploadHeaders,
          key: signed.key,
          size: signed.size,
          maxAllowedSize: MAX_BYTES_PER_CATEGORY[category],
          allowedMime: ALLOWED_MIME_PER_CATEGORY[category],
          expiresAt: signed.expiresAt.toISOString(),
        },
      },
      {
        status: 200,
        headers: { "cache-control": "no-store" },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Storage provider error.";
    // Don't leak internal config errors to client. Log + return generic message.
    console.error("[uploads/sign] provider error:", message);
    return NextResponse.json(
      { ok: false, error: "Storage is not configured. Contact support." },
      { status: 503 },
    );
  }
}
