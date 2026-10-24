import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-form";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Forgot password",
  description: "Reset your Gb Elaaj password by email.",
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="ge-display text-[28px] font-semibold text-ge-navy">Forgot your password?</h1>
      <p className="mt-1 text-sm text-ge-muted">
        Enter your email and we&apos;ll send you a link to choose a new one.
      </p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 text-sm text-ge-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-ge-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
