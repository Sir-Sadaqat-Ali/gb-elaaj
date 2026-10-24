import Link from "next/link";
import { ResetPasswordForm } from "./reset-form";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Choose a new password",
  description: "Set a new Gb Elaaj password.",
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div>
      <h1 className="ge-display text-[28px] font-semibold text-ge-navy">Choose a new password</h1>
      <p className="mt-1 text-sm text-ge-muted">
        At least 8 characters. We&apos;ll sign you in next time you visit.
      </p>
      <div className="mt-6">
        <ResetPasswordForm token={token} />
      </div>
      <p className="mt-6 text-sm text-ge-muted">
        Don&apos;t want to reset?{" "}
        <Link href="/login" className="font-medium text-ge-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
