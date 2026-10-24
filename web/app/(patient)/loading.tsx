import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function PatientLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-60 border-r border-ge-border bg-white md:block" aria-hidden />
      <div className="flex flex-1 flex-col">
        <div className="h-16 border-b border-ge-border bg-white" />
        <main className="flex-1 p-6">
          <Skeleton className="mb-2 h-7 w-2/5" />
          <Skeleton className="mb-6 h-3 w-1/4" />
          <div className="grid gap-3 md:grid-cols-3">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        </main>
      </div>
    </div>
  );
}
