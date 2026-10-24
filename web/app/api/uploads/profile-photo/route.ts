// POST /api/uploads/profile-photo
// Server-side profile-photo upload. This keeps small avatar uploads inside the
// authenticated Vercel request and avoids requiring browser-to-R2 CORS.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  ALLOWED_MIME_PER_CATEGORY,
  extensionFor,
  getStorageProvider,
  isAllowedMime,
  maxBytesFor,
} from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Please sign in to upload files." }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Choose a profile picture first." }, { status: 400 });
  }

  const category = "profile-photo" as const;
  if (!isAllowedMime(category, file.type)) {
    return NextResponse.json(
      { ok: false, error: `File type not allowed. Use ${ALLOWED_MIME_PER_CATEGORY[category].join(", ")}.` },
      { status: 400 },
    );
  }
  if (file.size > maxBytesFor(category)) {
    return NextResponse.json({ ok: false, error: "Profile picture must be 2 MB or smaller." }, { status: 400 });
  }

  const key = `profile-photo/${session.user.id}/${crypto.randomUUID()}.${extensionFor(file.type)}`;
  try {
    await getStorageProvider().upload({ key, contentType: file.type, body: await file.arrayBuffer() });
    return NextResponse.json({
      ok: true,
      data: { fileKey: key, fileMime: file.type, fileSize: file.size, fileName: file.name },
    }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    console.error("[uploads/profile-photo] provider error:", err);
    return NextResponse.json({ ok: false, error: "Storage is not configured. Contact support." }, { status: 503 });
  }
}
