import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_NAV } from "@/app/(admin)/admin/_nav";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/data/empty-state";
import { ConfirmButton } from "@/components/data/confirm-button";
import { adminDeleteReviewAction } from "@/lib/actions/reviews";
import { Star, MessageCircle } from "lucide-react";
import { formatDate } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  const session = await requireRole("ADMIN");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return null;

  const reviews = await prisma.review.findMany({
    include: { author: true, doctor: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <AppShell navItems={ADMIN_NAV} user={{ name: me.name, role: "Super Admin", image: me.image }} title="Reviews" subtitle="Patient reviews of providers.">
      {reviews.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No reviews yet" body="Reviews appear after completed appointments." />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-center gap-3">
                <Avatar src={r.author.image} name={r.author.name} size={36} />
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-ge-ink">{r.author.name}</div>
                  <div className="text-[11px] text-ge-muted">For Dr. {r.doctor.user.name} · {formatDate(r.createdAt)}</div>
                </div>
                <div className="inline-flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current text-[color:var(--ge-warning)]" : "text-ge-border"}`} />
                  ))}
                </div>
                <ConfirmButton
                  action={adminDeleteReviewAction}
                  arg={{ reviewId: r.id }}
                  label="Remove"
                  variant="destructive-outline"
                  confirmText="Remove this review?"
                  successMsg="Review removed."
                  className="h-7 px-2.5 text-[11px]"
                />
              </div>
              {r.text && <p className="mt-3 text-[13px] leading-relaxed text-ge-ink">{r.text}</p>}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
