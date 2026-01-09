import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FlowSkeleton() {
  return (
    <div className="w-full h-full px-6">
      <div className="w-full">
        <div className="space-y-6 max-w-full">
          {/* Header skeleton */}
          <div className="w-full p-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>

          {/* Stage filter pills skeleton */}
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-border min-w-fit"
              >
                <Skeleton className="h-4 w-16" />
                <Badge variant="secondary" className="bg-muted/50 text-xs">
                  <Skeleton className="h-3 w-6" />
                </Badge>
              </div>
            ))}
          </div>

          {/* Kanban columns skeleton */}
          <div className="flex flex-col md:flex-row p-4 md:p-0 md:pb-4 gap-4 overflow-x-auto pb-4 no-scrollbar">
            {Array.from({ length: 3 }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="shrink-0 w-full md:w-80 flex flex-col"
              >
                <div className="bg-muted/30 border border-border rounded-t-xl px-4 py-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Badge variant="outline" className="text-xs">
                      <Skeleton className="h-3 w-4" />
                    </Badge>
                  </div>
                </div>
                <div className="bg-muted/10 border border-t-0 border-border rounded-b-xl p-3 h-[500px] overflow-y-auto space-y-3">
                  {Array.from({ length: 3 }).map((_, cardIndex) => (
                    <Card key={cardIndex} className="bg-white">
                      <CardContent className="flex flex-col space-y-2 p-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-24" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
