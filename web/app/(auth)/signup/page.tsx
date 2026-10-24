import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/auth.config";
import { SignupForm } from "./signup-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Create account" };

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) redirect(ROLE_HOME[session.user.role]);
  return (
    <div>
      <h1 className="ge-display text-[28px] font-semibold text-ge-navy">Create your account</h1>
      <p className="mt-1 text-sm text-ge-muted">
        Free to sign up. No subscription. Pay only for what you use.
      </p>
      <div className="mt-6">
        <SignupForm />
      </div>
      <p className="mt-6 text-sm text-ge-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ge-primary hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-3 text-[12px] text-ge-muted">
        Are you a doctor, lab, or pharmacy? Provider onboarding is created by our admin team — please{" "}
        <Link href="/contact" className="font-medium text-ge-primary hover:underline">contact us</Link>.
      </p>
    </div>
  );
}
