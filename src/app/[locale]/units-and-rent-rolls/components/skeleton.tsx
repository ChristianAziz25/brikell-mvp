import { Skeleton } from "@/components/ui/skeleton";

export function RentRollSkeleton() {
  return (
    <div className="w-full">
      <div className="relative flex flex-col md:flex-row gap-4">
        {/* Filter sidebar */}
        <div className="sticky top-0 left-0 w-full md:w-72 md:shrink-0">
          <div className="mt-1 space-y-4 rounded-lg border bg-card/60 p-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 max-w-sm w-full" />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>

            <div className="flex flex-col gap-3">
              {/* Property name filter */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-full" />
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-full" />
              </div>

              {/* Rent Current range filter */}
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-20" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>

              {/* Rent Budget range filter */}
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-20" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>

              {/* Bedrooms range filter */}
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-20" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>

              {/* Bathrooms range filter */}
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-20" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-x-auto no-scrollbar overscroll-x-contain">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <div>
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2">
              <Skeleton className="h-11 w-full md:w-fit rounded-md" />
              <Skeleton className="h-11 w-full md:w-fit rounded-md" />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="relative w-full overflow-x-auto no-scrollbar">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <th
                        key={i}
                        className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground [&:has([role=checkbox])]:pr-0"
                      >
                        <Skeleton className="h-4 w-20" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr
                      key={i}
                      className="border-b transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted"
                    >
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td
                          key={j}
                          className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
                        >
                          <Skeleton className="h-4 w-24" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
