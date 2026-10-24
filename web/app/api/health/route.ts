import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Readiness probe — used by blue-green deploy to verify a fresh deploy
// can serve traffic before we flip the alias. Checks DB round-trip.
export async function GET() {
  const started = Date.now();
  const checks: Record<string, { ok: boolean; ms?: number; error?: string }> = {};

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    checks.database = { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }

  try {
    const t0 = Date.now();
    await prisma.platformSetting.findUnique({ where: { id: "singleton" }, select: { id: true } });
    checks.bootstrap = { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    checks.bootstrap = { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }

  const healthy = Object.values(checks).every((c) => c.ok);
  const totalMs = Date.now() - started;

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "unhealthy",
      checks,
      totalMs,
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}
