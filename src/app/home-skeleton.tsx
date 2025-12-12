import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return (
    <div>
      {/* Header */}
      <div className="space-y-3 text-center">
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-4 w-56 mx-auto" />
      </div>

      {/* Chat placeholder */}
      <Card className="h-64 w-full" />

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Button
            key={i}
            variant="outline"
            disabled
            className="h-auto py-2 px-2.5 border border-border/50 rounded-xl"
          >
            <Skeleton className="h-3 w-24" />
          </Button>
        ))}
      </div>

      {/* Dashboards header + cards */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="mt-2 h-40 border border-border/40 bg-card">
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-24 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
