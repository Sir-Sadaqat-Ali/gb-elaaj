import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyEmailToken } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify email" };

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await verifyEmailToken(token);

  if (result.ok) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ge-success/10 text-ge-success">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h1 className="ge-display text-[24px] font-semibold text-ge-navy">Email verified</h1>
        <p className="mt-2 text-sm text-ge-muted">
          {result.message ?? "Your email is verified."}
        </p>
        <Button asChild className="mt-5">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ge-danger/10 text-ge-danger">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h1 className="ge-display text-[24px] font-semibold text-ge-navy">Couldn&apos;t verify</h1>
      <p className="mt-2 text-sm text-ge-muted">{result.error}</p>
      <Button asChild variant="secondary" className="mt-5">
        <Link href="/login">Back to sign in</Link>
      </Button>
    </div>
  );
}
