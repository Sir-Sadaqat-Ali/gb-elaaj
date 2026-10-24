import Link from "next/link";
import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/auth.config";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Access denied",
  description: "You don't have permission to view that page.",
};

export default async function UnauthorizedPage() {
  const session = await auth();
  const dashboardHref = session?.user?.role ? ROLE_HOME[session.user.role] : "/login";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <Logo size={32} />
      <p className="mt-6 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ge-warning">
        403
      </p>
      <h1 className="ge-display mt-2 text-3xl font-semibold text-ge-navy">Access denied</h1>
      <p className="mt-2 max-w-md text-center text-sm text-ge-muted">
        You don&apos;t have permission to view that page. If you believe this is an error,
        contact support.
      </p>
      <div className="mt-5 flex gap-2">
        <Button asChild>
          <Link href={dashboardHref}>{session?.user ? "Back to your dashboard" : "Sign in"}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
