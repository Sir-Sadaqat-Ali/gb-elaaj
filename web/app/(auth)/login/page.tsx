import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/auth.config";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; reset?: string }>;
}) {
  const { next, error, reset } = await searchParams;
  // If already signed in, send them to their dashboard (or `next` if provided).
  // Guard every step: a corrupt/role-less session must never produce a redirect
  // loop — fall through to the form so the user can sign in again.
  const session = await auth();
  if (session?.user) {
    const role = session.user.role;
    const dashboard = role ? ROLE_HOME[role] : null;
    const dest = next && next.startsWith("/") ? next : dashboard;
    if (dest) redirect(dest);
  }
  return (
    <div>
      <h1 className="ge-display text-[28px] font-semibold text-ge-navy">Welcome back</h1>
      <p className="mt-1 text-sm text-ge-muted">Sign in to your Gb Elaaj account.</p>
      {reset === "ok" && (
        <div className="mt-4 rounded-md border border-ge-success/40 bg-ge-success/10 px-3 py-2 text-[12.5px] text-ge-ink">
          Password updated. Sign in with your new password.
        </div>
      )}
      <div className="mt-6">
        <LoginForm next={next} error={error} />
      </div>
      <div className="mt-3 text-right">
        <Link href="/forgot" className="text-[12.5px] font-medium text-ge-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      <p className="mt-6 text-sm text-ge-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-ge-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
