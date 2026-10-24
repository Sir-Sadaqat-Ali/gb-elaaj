// POST /api/location/geocode
//
// Forward geocode an address using the configured maps provider.
// Used by the home-care request form to cache lat/lng at create time.
//
// Auth-gated. Rate-limited 10/min/user.

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getMapsProvider } from "@/lib/maps";
import { checkRateLimit } from "@/lib/ai/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };

const inputSchema = z.object({
  address: z.string().min(3).max(400),
});

function err(status: number, code: string, message: string) {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status, headers: NO_STORE },
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return err(401, "UNAUTHORIZED", "Please sign in.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err(400, "BAD_JSON", "Invalid JSON.");
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return err(400, "VALIDATION", "Address is required.");

  const rl = checkRateLimit({ key: `geo:${session.user.id}`, max: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: { code: "RATE_LIMITED", message: "Too many geocode requests." } },
      { status: 429, headers: NO_STORE },
    );
  }

  try {
    const provider = getMapsProvider();
    const result = await provider.geocode(parsed.data.address);
    return NextResponse.json(
      {
        ok: true,
        data: result
          ? { lat: result.lat, lng: result.lng, formatted: result.formatted }
          : null,
        provider: provider.name,
      },
      { headers: NO_STORE },
    );
  } catch (e) {
    console.error("[location/geocode] provider error:", e);
    return NextResponse.json(
      { ok: true, data: null, error: { code: "PROVIDER_ERROR" } },
      { headers: NO_STORE },
    );
  }
}
