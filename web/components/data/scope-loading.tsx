import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

/**
 * Reused by every dashboard (role) loading.tsx. The actual layout/sidebar
 * is rendered by the parent layout, so we only fill the main content area.
 */
export function ScopeLoading() {
  return (
    <div className="p-6">
      <Skeleton className="mb-2 h-7 w-2/5" />
      <Skeleton className="mb-6 h-3 w-1/4" />
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
