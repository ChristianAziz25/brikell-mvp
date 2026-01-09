import { Skeleton } from "@/components/ui/skeleton";

export function MyAssetsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Asset pill buttons row skeleton */}
      <div className="flex flex-row gap-2 overflow-x-auto no-scrollbar overscroll-x-contain">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32 shrink-0" />
        ))}
      </div>

      {/* Table skeleton approximating the data table */}
      <div className="space-y-8">
        <section className="space-y-3">
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="relative w-full overflow-auto no-scrollbar overscroll-x-contain">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b">
                    <th className="h-12 px-4">
                      <Skeleton className="h-4 w-20" />
                    </th>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <th key={i} className="h-12 px-4 text-center">
                        <Skeleton className="h-4 w-16 mx-auto" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 12 }).map((_, rowIndex) => (
                    <tr key={rowIndex} className="border-b">
                      <td className="p-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      {Array.from({ length: 5 }).map((_, colIndex) => (
                        <td key={colIndex} className="p-4 text-center">
                          <Skeleton className="h-4 w-20 mx-auto" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
