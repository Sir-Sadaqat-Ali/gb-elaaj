// ─────────────────────────────────────────────────────────────
// Edge-safe Auth.js config
// No Node-only deps (no prisma, no bcrypt) so middleware can use it.
// The full config in lib/auth.ts spreads this, then adds Credentials + adapter.
// ─────────────────────────────────────────────────────────────

import type { NextAuthConfig, DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

// Where each role lands when they have no specific destination
export const ROLE_HOME: Record<Role, string> = {
  PATIENT: "/patient/dashboard",
  DOCTOR: "/doctor/dashboard",
  PHARMACY_ADMIN: "/pharmacy-admin/dashboard",
  LAB_ADMIN: "/lab-admin/dashboard",
  NURSE: "/nurse/dashboard",
  FINANCE: "/finance/dashboard",
  ADMIN: "/admin/dashboard",
};

export const ROLE_LABEL: Record<Role, string> = {
  PATIENT: "Patient",
  DOCTOR: "Doctor",
  PHARMACY_ADMIN: "Pharmacy Admin",
  LAB_ADMIN: "Lab Admin",
  NURSE: "Nurse",
  FINANCE: "Finance",
  ADMIN: "Super Admin",
};

// Doctor-scope routes (we use a fixed allow-list because /doctor/[slug] is
// the *public* doctor profile and shares the same prefix).
const DOCTOR_SCOPE_ROUTES = [
  "/doctor/dashboard",
  "/doctor/appointments",
  "/doctor/schedule",
  "/doctor/time-slots",
  "/doctor/patients",
  "/doctor/lab-reports",
  "/doctor/prescriptions",
  "/doctor/earnings",
  "/doctor/withdrawals",
  "/doctor/public-profile",
  "/doctor/video-room",
];

function isDoctorScope(p: string) {
  return DOCTOR_SCOPE_ROUTES.some((r) => p === r || p.startsWith(r + "/"));
}

export type ProtectedRule = { match: (p: string) => boolean; roles: Role[] };

// Single source of truth for which paths require which role.
// Used by both the edge middleware and the server-side requireRole helper.
export const PROTECTED_ROUTES: ProtectedRule[] = [
  { match: (p) => p === "/patient" || p.startsWith("/patient/"), roles: ["PATIENT"] },
  { match: isDoctorScope, roles: ["DOCTOR"] },
  { match: (p) => p === "/pharmacy-admin" || p.startsWith("/pharmacy-admin/"), roles: ["PHARMACY_ADMIN"] },
  { match: (p) => p === "/lab-admin" || p.startsWith("/lab-admin/"), roles: ["LAB_ADMIN"] },
  { match: (p) => p === "/nurse" || p.startsWith("/nurse/"), roles: ["NURSE"] },
  { match: (p) => p === "/finance" || p.startsWith("/finance/"), roles: ["FINANCE"] },
  { match: (p) => p === "/admin" || p.startsWith("/admin/"), roles: ["ADMIN"] },
];

export function findProtection(pathname: string): ProtectedRule | null {
  return PROTECTED_ROUTES.find((r) => r.match(pathname)) ?? null;
}

// Auth-driven redirects must NEVER be cached by the browser or Vercel CDN.
// Without `Cache-Control: no-store` these 302s pin in the disk cache and
// reproduce themselves on every reload — that's the redirect-loop pattern.
function noStoreRedirect(url: URL): Response {
  return new Response(null, {
    status: 307,
    headers: {
      location: url.toString(),
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      pragma: "no-cache",
    },
  });
}

// ── Module augmentation ──────────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}


// ── Auth config (edge-safe) ──────────────────────────────────
export const authConfig = {
  pages: { signIn: "/login" },
  trustHost: true,
  session: { strategy: "jwt" },
  // Providers are added in lib/auth.ts (Credentials needs bcrypt + prisma).
  // We declare an empty array here so middleware can import this config.
  providers: [],
  callbacks: {
    // Runs on every request matching the middleware matcher.
    // Returning true allows the request; returning a Response (or false) blocks.
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const rule = findProtection(path);

      // Debug surface — append ?_diag=1 to any URL to dump the middleware view.
      // Lets us tell apart "no session" vs "session but role missing".
      // Gated to dev (or admin) — see SECURITY_AUDIT.md §4.
      const diagAllowed = process.env.NODE_ENV !== "production" || auth?.user?.role === "ADMIN";
      if (diagAllowed && request.nextUrl.searchParams.get("_diag") === "1") {
        return new Response(
          JSON.stringify(
            {
              path,
              ruleRoles: rule?.roles ?? null,
              hasAuth: !!auth,
              hasUser: !!auth?.user,
              userId: auth?.user?.id ?? null,
              userRole: auth?.user?.role ?? null,
              authUserKeys: auth?.user ? Object.keys(auth.user) : [],
            },
            null,
            2,
          ),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
            },
          },
        );
      }

      // 1. Public route — let the request through unconditionally.
      if (!rule) return true;

      // 2. Protected route, no session — bounce to /login with `next` preserved.
      if (!auth?.user) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", path);
        return noStoreRedirect(url);
      }

      // 3. Protected route, wrong role — send to that role's home.
      const role = auth.user.role;
      if (!role || !rule.roles.includes(role)) {
        const url = request.nextUrl.clone();
        url.pathname = role ? ROLE_HOME[role] : "/login";
        url.search = "";
        return noStoreRedirect(url);
      }

      // 4. Allowed.
      return true;
    },

    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },

    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
