// POST /api/location/update
//
// Nurse posts a GPS ping for an active home-care assignment.
// Inserts NurseLocation row + updates HomeCareRequest cached snapshot.
//
// Safety chain:
//   1. Auth → 401
//   2. Caller role must be NURSE → 403
//   3. Caller must be the assigned nurse on this request → 403
//   4. Status ∈ (ASSIGNED, EN_ROUTE, IN_VISIT) → 422 BAD_STATUS
//   5. lat/lng valid → 400
//   6. Rate limit 30/min/nurse → 429
//   7. Insert + cache update + (sampled) audit log

import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, Role, HomeCareStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/ai/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };

const inputSchema = z.object({
  homeCareRequestId: z.string().min(1).max(40),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().optional(),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().nonnegative().optional(),
  source: z.enum(["browser", "manual"]).default("browser"),
});

const ACTIVE_STATUSES = new Set<HomeCareStatus>([
  HomeCareStatus.ASSIGNED,
  HomeCareStatus.EN_ROUTE,
  HomeCareStatus.IN_VISIT,
]);

function err(status: number, code: string, message: string) {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status, headers: NO_STORE },
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return err(401, "UNAUTHORIZED", "Please sign in.");
  if (session.user.role !== Role.NURSE) return err(403, "FORBIDDEN", "Only nurses can post locations.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err(400, "BAD_JSON", "Invalid JSON.");
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return err(400, "VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input.");
  }
  const data = parsed.data;

  // Rate limit (30/min/nurse — generous because watchPosition fires often)
  const rl = checkRateLimit({ key: `loc:${session.user.id}`, max: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: { code: "RATE_LIMITED", message: "Too many updates." } },
      { status: 429, headers: { ...NO_STORE, "x-ratelimit-reset": String(rl.resetAt) } },
    );
  }

  // Resolve nurse profile + load request
  const nurseProfile = await prisma.nurseProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!nurseProfile) return err(403, "FORBIDDEN", "Nurse profile not found.");

  const request = await prisma.homeCareRequest.findUnique({
    where: { id: data.homeCareRequestId },
    select: { id: true, nurseId: true, status: true },
  });
  if (!request) return err(404, "NOT_FOUND", "Home-care request not found.");
  if (request.nurseId !== nurseProfile.id) {
    return err(403, "FORBIDDEN", "You are not assigned to this request.");
  }
  if (!ACTIVE_STATUSES.has(request.status)) {
    return err(422, "BAD_STATUS", `Cannot update location while request is ${request.status}.`);
  }

  // Insert ping + update snapshot in a single transaction
  const created = await prisma.$transaction(async (tx) => {
    const ping = await tx.nurseLocation.create({
      data: {
        nurseId: nurseProfile.id,
        homeCareRequestId: request.id,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        heading: data.heading,
        speed: data.speed,
        source: data.source,
      },
    });
    await tx.homeCareRequest.update({
      where: { id: request.id },
      data: {
        lastNurseLat: data.latitude,
        lastNurseLng: data.longitude,
        lastLocationAt: ping.createdAt,
      },
    });
    return ping;
  });

  // Sampled audit (every ~5th ping). Spammy logs hurt audit value.
  if (Math.random() < 0.2) {
    prisma.auditLog
      .create({
        data: {
          actorUserId: session.user.id,
          action: "location.update.received",
          targetType: "HomeCareRequest",
          targetId: request.id,
          meta: {
            accuracy: data.accuracy ?? null,
            source: data.source,
          } as Prisma.InputJsonValue,
        },
      })
      .catch(() => {});
  }

  return NextResponse.json(
    { ok: true, data: { id: created.id, at: created.createdAt.toISOString() } },
    { status: 200, headers: NO_STORE },
  );
}
