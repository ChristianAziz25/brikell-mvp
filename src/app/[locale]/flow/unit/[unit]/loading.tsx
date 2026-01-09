import { PageAnimation } from "@/components/page-animation";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function UnitLoading() {
  return (
    <PageAnimation>
      <div className="h-full flex flex-col gap-6">
        {/* Back button */}
        <Skeleton className="h-10 w-full md:w-32 mb-2 md:ml-6" />

        <div className="w-full flex flex-col md:flex-row gap-6 min-w-0">
          {/* Property card */}
          <div className="md:pl-6 md:w-80 md:shrink-0 space-y-6">
            <div className="border bg-card text-card-foreground shadow-sm p-6 rounded-2xl space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>

              <Skeleton className="h-6 w-20 rounded-full" />

              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              <Separator />

              <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional details card */}
            <div className="border bg-card text-card-foreground shadow-sm p-6 rounded-2xl space-y-4">
              <Skeleton className="h-5 w-40" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 min-w-0 md:pr-6 space-y-6">
            {/* Lease Information */}
            <div className="border bg-card text-card-foreground shadow-sm p-6 rounded-2xl space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>

            {/* Tenant Information */}
            <div className="border bg-card text-card-foreground shadow-sm p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="border bg-card text-card-foreground shadow-sm p-6 rounded-2xl space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageAnimation>
  );
}

