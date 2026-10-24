// GET /api/location/route?homeCareRequestId=
//
// Returns route geometry + meters + minutes from the nurse's current position
// to the request's address (geocoded coords).
//
// Same RBAC as /api/location/latest.
// If either endpoint coord is missing, returns { available: false }.

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { whoCanAccess } from "@/lib/location/rbac";
import { getMapsProvider } from "@/lib/maps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };

const inputSchema = z.object({
  homeCareRequestId: z.string().min(1).max(40),
});

function err(status: number, code: string, message: string) {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status, headers: NO_STORE },
  );
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return err(401, "UNAUTHORIZED", "Please sign in.");

  const url = new URL(req.url);
  const parsed = inputSchema.safeParse({
    homeCareRequestId: url.searchParams.get("homeCareRequestId") ?? "",
  });
  if (!parsed.success) return err(400, "VALIDATION", "Missing homeCareRequestId.");

  const request = await prisma.homeCareRequest.findUnique({
    where: { id: parsed.data.homeCareRequestId },
    include: {
      patient: { include: { user: { select: { id: true } } } },
      nurse: { include: { user: { select: { id: true } } } },
    },
  });
  if (!request) return err(404, "NOT_FOUND", "Home-care request not found.");

  const role = whoCanAccess(session.user.id, session.user.role, request);
  if (!role) return err(403, "FORBIDDEN", "You don't have permission to view this route.");

  if (
    request.lastNurseLat == null ||
    request.lastNurseLng == null ||
    request.addressLat == null ||
    request.addressLng == null
  ) {
    return NextResponse.json(
      { ok: true, data: { available: false, reason: "missing_coords" } },
      { headers: NO_STORE },
    );
  }

  try {
    const provider = getMapsProvider();
    const route = await provider.getRoute(
      { lat: request.lastNurseLat, lng: request.lastNurseLng },
      { lat: request.addressLat, lng: request.addressLng },
    );
    if (!route) {
      return NextResponse.json(
        { ok: true, data: { available: false, reason: "no_route" } },
        { headers: NO_STORE },
      );
    }
    return NextResponse.json(
      {
        ok: true,
        data: {
          available: true,
          provider: provider.name,
          coordinates: route.coordinates,
          meters: route.meters,
          minutes: route.minutes,
        },
      },
      { headers: NO_STORE },
    );
  } catch (e) {
    console.error("[location/route] provider error:", e);
    return NextResponse.json(
      { ok: true, data: { available: false, reason: "provider_error" } },
      { headers: NO_STORE },
    );
  }
}
