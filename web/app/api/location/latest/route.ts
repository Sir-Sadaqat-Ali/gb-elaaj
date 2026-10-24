// GET /api/location/latest?homeCareRequestId=
//
// Fetch the latest cached nurse position for a home-care request.
//
// Access matrix (see lib/location/rbac.ts):
//   • Patient on the request   → allowed
//   • Assigned nurse           → allowed
//   • Admin                    → allowed + audit-logged
//   • Anyone else              → 403

import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { whoCanAccess } from "@/lib/location/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };

const inputSchema = z.object({
  homeCareRequestId: z.string().min(1).max(40),
});

const STALE_THRESHOLD_MS = 90_000; // 90s

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
  if (!role) return err(403, "FORBIDDEN", "You don't have permission to view this location.");

  // Audit admin reads (privacy compliance)
  if (role === "admin") {
    prisma.auditLog
      .create({
        data: {
          actorUserId: session.user.id,
          action: "location.fetch.viewed",
          targetType: "HomeCareRequest",
          targetId: request.id,
          meta: { caller: "admin" } as Prisma.InputJsonValue,
        },
      })
      .catch(() => {});
  }

  if (request.lastNurseLat == null || request.lastNurseLng == null || !request.lastLocationAt) {
    return NextResponse.json(
      {
        ok: true,
        data: {
          available: false,
          status: request.status,
        },
      },
      { headers: NO_STORE },
    );
  }

  const ageMs = Date.now() - request.lastLocationAt.getTime();
  const stale = ageMs > STALE_THRESHOLD_MS;

  return NextResponse.json(
    {
      ok: true,
      data: {
        available: true,
        lat: request.lastNurseLat,
        lng: request.lastNurseLng,
        lastUpdatedAt: request.lastLocationAt.toISOString(),
        ageSeconds: Math.round(ageMs / 1000),
        stale,
        status: request.status,
        addressLat: request.addressLat,
        addressLng: request.addressLng,
      },
    },
    { headers: NO_STORE },
  );
}
