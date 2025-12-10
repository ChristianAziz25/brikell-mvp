import { Skeleton } from "@/components/ui/skeleton";

export function MyAssetsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Asset pill buttons row skeleton */}
      <div className="flex flex-row gap-2 overflow-x-auto no-scrollbar overscroll-x-contain">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-8 w-24 rounded-full shrink-0 bg-muted/60"
          />
        ))}
      </div>

      {/* Table skeleton approximating the data table */}
      <div className="space-y-4">
        <div className="border rounded-xl bg-card overflow-hidden">
          {/* Table header row */}
          <Skeleton className="h-10 w-full" />
          {/* A few body rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
