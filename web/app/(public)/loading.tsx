import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container py-12">
      <Skeleton className="mb-3 h-3 w-40" />
      <Skeleton className="mb-2 h-10 w-2/3" />
      <Skeleton className="mb-6 h-4 w-1/3" />
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
