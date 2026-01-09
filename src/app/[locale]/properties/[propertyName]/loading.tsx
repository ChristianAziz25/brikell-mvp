import { PageAnimation } from "@/components/page-animation";
import { Skeleton } from "@/components/ui/skeleton";

export default function PropertyDetailsLoading() {
  return (
    <PageAnimation>
      <div className="space-y-6">
        {/* Header */}
        <div className="w-full space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Asset selection buttons */}
        <div className="flex flex-row gap-2 overflow-x-auto no-scrollbar overscroll-x-contain">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-32 shrink-0" />
          ))}
        </div>

        {/* Main table */}
        <div className="space-y-8">
          <section className="space-y-3">
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="relative w-full overflow-auto no-scrollbar overscroll-x-contain">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors">
                      <th className="h-12 px-4">
                        <Skeleton className="h-4 w-20" />
                      </th>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <th key={i} className="h-12 px-4">
                          <Skeleton className="h-4 w-16" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* TRI Section */}
                    {Array.from({ length: 4 }).map((_, rowIndex) => (
                      <tr key={`tri-${rowIndex}`} className="border-b">
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
                    {/* CAPEX Section */}
                    {Array.from({ length: 3 }).map((_, rowIndex) => (
                      <tr key={`capex-${rowIndex}`} className="border-b">
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
                    {/* OPEX Section */}
                    {Array.from({ length: 3 }).map((_, rowIndex) => (
                      <tr key={`opex-${rowIndex}`} className="border-b">
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
                    {/* NOI Section */}
                    {Array.from({ length: 2 }).map((_, rowIndex) => (
                      <tr key={`noi-${rowIndex}`} className="border-b">
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
    </PageAnimation>
  );
}

