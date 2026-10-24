import { AlertCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ResendVerifyButton } from "@/components/layout/resend-verify-button";

/**
 * Shown on every portal page (from AppShell) to any signed-in user whose email
 * isn't verified yet. Best-effort — never blocks the shell from rendering.
 */
export async function EmailVerifyBanner() {
  try {
    const session = await auth();
    if (!session?.user) return null;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, emailVerified: true },
    });
    if (!user?.email || user.emailVerified) return null;

    return (
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-[color:var(--ge-warning-border)] bg-[color:var(--ge-warning-bg)] px-4 py-3">
        <AlertCircle className="h-4 w-4 shrink-0 text-[color:var(--ge-warning)]" />
        <p className="text-[12.5px] text-[color:var(--ge-warning)]">
          <strong>Verify your email.</strong> We sent a link to {user.email}. Booking and some actions require a verified email.
        </p>
        <div className="ml-auto">
          <ResendVerifyButton />
        </div>
      </div>
    );
  } catch {
    return null;
  }
}
