// ─────────────────────────────────────────────────────────────
// Edge middleware — page-level access guard.
// Uses Auth.js v5 wrapper so JWT decoding matches the server-side `auth()`.
// All protection rules live in lib/auth.config.ts (edge-safe, no DB / no bcrypt).
// Server layouts still call requireRole() for defence-in-depth.
// ─────────────────────────────────────────────────────────────

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export default middleware((/* req */) => {
  // The `authorized` callback in authConfig handles the actual logic.
  // Returning undefined here lets NextAuth take the result of `authorized`.
  return;
});

// Match every path except API/static assets/file extensions.
// Public routes are still hit but `authorized` returns true for them.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
