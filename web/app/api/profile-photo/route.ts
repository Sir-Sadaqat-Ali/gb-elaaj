// Public, stable image URL for profile photos stored in private object storage.
// The storage key is validated before a short-lived signed download URL is issued.

import { NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROFILE_PHOTO_KEY_RE = /^profile-photo\/[A-Za-z0-9_-]{1,40}\/[A-Za-z0-9_-]{8,40}\.(png|jpg|webp)$/;

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!PROFILE_PHOTO_KEY_RE.test(key)) {
    return NextResponse.json({ ok: false, error: "Invalid profile photo." }, { status: 400 });
  }

  try {
    const signed = await getStorageProvider().signDownload({ key, expiresInSeconds: 600 });
    return NextResponse.redirect(signed.downloadUrl, {
      headers: { "cache-control": "public, max-age=300, stale-while-revalidate=600" },
    });
  } catch (err) {
    console.error("[profile-photo] provider error:", err);
    return NextResponse.json({ ok: false, error: "Profile photo is unavailable." }, { status: 404 });
  }
}
