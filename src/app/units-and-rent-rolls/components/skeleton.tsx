import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RentRollSkeleton() {
  return (
    <div className="w-full space-y-6">
      {/* Header + actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-2">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </div>

      {/* Search + filter controls */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-64" />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Button
            disabled
            variant="ghost"
            className="cursor-default flex items-center justify-center w-8 h-8 rounded-md"
          >
            <Skeleton className="h-5 w-5 rounded-full" />
          </Button>
        </div>
      </div>

      {/* Table skeleton */}
      <Card className="overflow-hidden border bg-card">
        <div className="w-full overflow-x-auto no-scrollbar">
          {/* Header row */}
          <div className="border-b">
            <div className="flex">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-10 flex-1 min-w-[120px] border-r last:border-r-0"
                />
              ))}
            </div>
          </div>

          {/* Body rows */}
          <div className="divide-y">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton
                    key={j}
                    className="h-9 flex-1 min-w-[120px] border-r last:border-r-0"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}


