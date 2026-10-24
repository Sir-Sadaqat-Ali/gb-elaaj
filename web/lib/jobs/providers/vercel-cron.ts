// Vercel Cron jobs adapter. Vercel Cron triggers GET requests to /api/cron/* paths
// configured in vercel.json. Authorization happens via either the Vercel-provided
// header or a shared CRON_SECRET that we attach to every Vercel Cron path.
//
// To activate:
//  1. Add CRON_SECRET to Vercel env (long random string).
//  2. Add "crons" array to vercel.json.
//  3. In each /api/cron/<name>/route.ts, call vercelCron.authorizeCron(req.headers).

import type { JobsProvider } from "../types";

export const vercelCron: JobsProvider = {
  name: "vercel-cron",

  authorizeCron(headers: Headers): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;
    const auth = headers.get("authorization") ?? "";
    return auth === `Bearer ${secret}`;
  },
};
