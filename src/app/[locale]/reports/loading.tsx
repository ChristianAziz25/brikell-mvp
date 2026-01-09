import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Recent Reports Card */}
      <Card className="shadow-card">
        <CardHeader className="p-6 pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-9 w-9" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports Card */}
      <Card className="shadow-card">
        <CardHeader className="p-6 pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-9 w-9" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

