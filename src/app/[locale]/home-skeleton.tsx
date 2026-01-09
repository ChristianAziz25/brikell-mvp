import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto h-full space-y-12">
      <section className="max-w-2xl mx-auto space-y-8 pt-12">
        {/* Header */}
        <div className="space-y-2 text-center">
          <Skeleton className="h-9 w-64 mx-auto" />
          <Skeleton className="h-5 w-72 mx-auto" />
        </div>

        {/* Search placeholder */}
        <div className="bg-card rounded-2xl p-2.5 border">
          <div className="flex min-h-14 items-center px-1.5">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </section>

      {/* Dashboards section */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-40 uppercase" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="mt-2 border border-border/40 bg-card">
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Skeleton className="h-32 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
