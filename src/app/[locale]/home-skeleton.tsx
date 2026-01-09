import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto h-full space-y-12">
      <section className="max-w-2xl mx-auto space-y-8 pt-12">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>

        {/* Chat placeholder */}
        <Card className="h-64 w-full" />
      </section>

      {/* Dashboards header + cards */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-3">
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
