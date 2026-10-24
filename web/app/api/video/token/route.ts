// POST /api/video/token
//
// Issues an Agora RTC token for an active appointment. Both the patient
// and the doctor on the appointment can request a token — anyone else
// gets 403.
//
// Validation chain (all must pass):
//   1. Auth session present
//   2. Caller is patient OR doctor of that appointment
//   3. Appointment exists, mode=VIDEO, not CANCELLED/NO_SHOW
//   4. Now is within [scheduledFor - 10min, scheduledFor + duration + 30min]
//
// Side effects:
//   - Writes AuditLog `video.token.issued` (action, role, appt id)
//   - On first join, populates Appointment.startedAt (best-effort)

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getVideoProvider } from "@/lib/video";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({
  appointmentId: z.string().min(1).max(40),
});

const PRE_WINDOW_MIN = 10;
const POST_WINDOW_MIN = 30;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, error: "Please sign in." },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Missing appointmentId." },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  const appt = await prisma.appointment.findUnique({
    where: { id: parsed.data.appointmentId },
    include: {
      patient: { select: { userId: true, user: { select: { name: true } } } },
      doctor: { select: { userId: true, user: { select: { name: true } } } },
    },
  });
  if (!appt) {
    return NextResponse.json(
      { ok: false, error: "Appointment not found." },
      { status: 404, headers: { "cache-control": "no-store" } },
    );
  }

  // 1. RBAC — caller must be patient or doctor on this appointment (admin allowed too)
  const isPatient = appt.patient.userId === session.user.id;
  const isDoctor = appt.doctor.userId === session.user.id;
  if (!isPatient && !isDoctor && session.user.role !== Role.ADMIN) {
    return NextResponse.json(
      { ok: false, error: "You don't have permission to join this consultation." },
      { status: 403, headers: { "cache-control": "no-store" } },
    );
  }

  // 2. Mode + status guards
  if (appt.mode !== "VIDEO") {
    return NextResponse.json(
      { ok: false, error: "This appointment is not a video consultation." },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }
  if (appt.status === "CANCELLED" || appt.status === "NO_SHOW") {
    return NextResponse.json(
      { ok: false, error: `This appointment is ${appt.status.toLowerCase()}.` },
      { status: 403, headers: { "cache-control": "no-store" } },
    );
  }

  // 3. Time-window check — joinable from 10 min before until 30 min after.
  const now = Date.now();
  const startMs = appt.scheduledFor.getTime() - PRE_WINDOW_MIN * 60_000;
  const endMs = appt.scheduledFor.getTime() + (appt.durationMin + POST_WINDOW_MIN) * 60_000;
  if (now < startMs) {
    const minsAway = Math.ceil((startMs - now) / 60_000);
    return NextResponse.json(
      { ok: false, error: `This consultation isn't joinable yet. Try again in ${minsAway} minute${minsAway === 1 ? "" : "s"}.` },
      { status: 403, headers: { "cache-control": "no-store" } },
    );
  }
  if (now > endMs) {
    return NextResponse.json(
      { ok: false, error: "This consultation window has closed." },
      { status: 403, headers: { "cache-control": "no-store" } },
    );
  }

  // 4. Issue token
  const role: "host" | "participant" = isDoctor ? "host" : "participant";
  const channel = appt.videoRoomId && appt.videoRoomId.length >= 4
    ? appt.videoRoomId
    : `appt-${appt.id}`;

  let issued;
  try {
    const provider = getVideoProvider();
    issued = await provider.generateToken({
      channel,
      userId: session.user.id,
      role,
      expiresAt: new Date(endMs),
    });
  } catch (err) {
    console.error("[video/token] provider error:", err);
    return NextResponse.json(
      { ok: false, error: "Video service is not configured. Contact support." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  // 5. Audit + best-effort startedAt
  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "video.token.issued",
      targetType: "Appointment",
      targetId: appt.id,
      meta: { role, channel },
    },
  }).catch(() => {});

  if (!appt.startedAt) {
    await prisma.appointment.update({
      where: { id: appt.id },
      data: { startedAt: new Date() },
    }).catch(() => {});
  }

  return NextResponse.json(
    {
      ok: true,
      data: {
        token: issued.token,
        channel: issued.channel,
        appId: issued.appId,
        uid: issued.uid,
        role,
        // Names for client-side UI labels (not security-relevant)
        localName: isDoctor ? appt.doctor.user.name : appt.patient.user.name,
        remoteName: isDoctor ? appt.patient.user.name : appt.doctor.user.name,
        expiresAt: issued.expiresAt.toISOString(),
        scheduledFor: appt.scheduledFor.toISOString(),
        durationMin: appt.durationMin,
      },
    },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
}
