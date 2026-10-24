import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <Logo size={32} />
      <p className="mt-6 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ge-primary">404</p>
      <h1 className="ge-display mt-2 text-3xl font-semibold text-ge-navy">Page not found</h1>
      <p className="mt-2 max-w-md text-center text-sm text-ge-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild className="mt-5">
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
