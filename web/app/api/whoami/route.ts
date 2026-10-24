import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Debug surface — production must not expose session+cookie state.
// Gated to dev only OR ADMIN role in any environment.
async function isAllowed(): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function GET() {
  if (!(await isAllowed())) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const session = await auth();
  const h = await headers();
  const c = await cookies();
  const cookieNames = c.getAll().map((x) => x.name);
  return NextResponse.json(
    {
      session,
      cookieNames,
      host: h.get("host"),
      userAgent: h.get("user-agent")?.slice(0, 80),
      time: new Date().toISOString(),
    },
    {
      headers: {
        "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    },
  );
}
