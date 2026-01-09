import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnomalyDetectionLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[160px]" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anomaly Line Items Table */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b border-border">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <th key={i} className="h-12 px-4">
                        <Skeleton className="h-3 w-16" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {Array.from({ length: 5 }).map((_, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-border">
                      {Array.from({ length: 8 }).map((_, colIndex) => (
                        <td key={colIndex} className="p-4">
                          <Skeleton
                            className={`h-4 ${
                              colIndex === 6 ? "w-24" : "w-20"
                            }`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Variance Analysis Card */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
                <Skeleton className="h-12 w-full" />
                {i < 3 && <Skeleton className="h-px w-full mt-3" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
