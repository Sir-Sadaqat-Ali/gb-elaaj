import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Debug surface — in production, anyone hitting this URL would log themselves out.
// Restrict to development environment only.
async function isAllowed(): Promise<boolean> {
  return process.env.NODE_ENV !== "production";
}

const AUTH_COOKIE_NAMES = [
  "authjs.session-token",
  "authjs.csrf-token",
  "authjs.callback-url",
  "authjs.pkce.code_verifier",
  "__Secure-authjs.session-token",
  "__Secure-authjs.callback-url",
  "__Host-authjs.csrf-token",
  // legacy v4 names just in case
  "next-auth.session-token",
  "next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.session-token",
  "__Secure-next-auth.callback-url",
  "__Host-next-auth.csrf-token",
];

export async function GET() {
  if (!(await isAllowed())) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const c = await cookies();
  const cleared: string[] = [];
  for (const name of AUTH_COOKIE_NAMES) {
    if (c.has(name)) {
      c.delete(name);
      cleared.push(name);
    }
  }
  const res = NextResponse.json(
    {
      ok: true,
      cleared,
      message: "Session cookies cleared. Visit /login to sign in fresh.",
    },
    {
      headers: {
        "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    },
  );
  // Belt-and-suspenders: also overwrite via Set-Cookie with Max-Age=0
  for (const name of AUTH_COOKIE_NAMES) {
    res.cookies.set(name, "", { maxAge: 0, path: "/" });
  }
  return res;
}
