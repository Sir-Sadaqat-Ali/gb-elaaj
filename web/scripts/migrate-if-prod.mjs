#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// Run `prisma migrate deploy` only on Vercel Production builds.
//
// Why this exists:
//   GitHub pushes auto-trigger a Vercel **Preview** deploy in addition to our
//   blue-green Production deploy. Preview environments do not have
//   DATABASE_URL or DIRECT_URL set (and shouldn't — Preview should never run
//   migrations against the prod DB). Including `prisma migrate deploy` in the
//   shared `vercel-build` script caused every Preview deploy to fail with
//   P1012 "Environment variable not found: DIRECT_URL".
//
// Behavior:
//   • VERCEL_ENV=production         → run migrations (gate to prod DB only)
//   • VERCEL_ENV=preview|development → skip migrations
//   • VERCEL_ENV unset (local)       → skip migrations (use `pnpm db:deploy` manually)
//   • Migration failure              → exit 1, fails the build (correct: don't ship code
//                                     against an outdated schema)
// ─────────────────────────────────────────────────────────────

import { spawnSync } from "node:child_process";

const env = process.env.VERCEL_ENV ?? "(unset)";

if (env !== "production") {
  console.log(`[migrate-if-prod] VERCEL_ENV=${env} — skipping migrations.`);
  process.exit(0);
}

if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  console.error("[migrate-if-prod] VERCEL_ENV=production but DATABASE_URL or DIRECT_URL is missing.");
  console.error("[migrate-if-prod] Set both in Vercel → Settings → Environment Variables → Production.");
  process.exit(1);
}

console.log("[migrate-if-prod] VERCEL_ENV=production — running prisma migrate deploy...");
const result = spawnSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: false,
});

process.exit(result.status ?? 1);
