import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DataLibraryLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Data Sources Card */}
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
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Updates Card */}
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
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

