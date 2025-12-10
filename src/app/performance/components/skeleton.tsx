import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PerformanceSkeleton() {
  return (
    <div className="space-y-6">
      {/* Asset pill buttons row */}
      <div className="flex flex-row gap-2 overflow-x-auto no-scrollbar overscroll-x-contain">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-8 w-24 rounded-full shrink-0 bg-muted/60"
          />
        ))}
      </div>

      {/* Chart card + top stats skeletons */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-5 w-32" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-48 mt-1" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Top avg values row, same layout as real stats */}
          <div className="w-full flex flex-row gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="relative flex-1 min-w-0 flex items-center gap-2.5 rounded-lg border border-border/40 bg-card px-3 py-2"
              >
                <Skeleton className="absolute left-0 top-1/2 w-0.5 h-12 translate-y-[-50%] rounded-full" />
                <div className="flex flex-col gap-2 min-w-0 ml-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>

          {/* Chart area skeleton approximating the AreaChart height */}
          <Skeleton className="mt-4 h-64 w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}
