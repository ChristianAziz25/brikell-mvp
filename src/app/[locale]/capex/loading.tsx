import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CapexLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-lg shadow-sm border-border">
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actuals Chart */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm shadow-card">
          <CardHeader className="flex flex-col space-y-1.5 p-6 pb-2">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>

        {/* Replacement Timeline */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm shadow-card">
          <CardHeader className="flex flex-col space-y-1.5 p-6 pb-2">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg border border-muted/30"
              >
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

