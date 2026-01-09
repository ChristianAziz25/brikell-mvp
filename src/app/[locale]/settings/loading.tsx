import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card
            key={i}
            className="bg-card border border-border rounded-lg shadow-elevation-1"
          >
            <CardHeader className="p-5 pb-3">
              <div className="flex items-start gap-4">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <Skeleton className="h-5 w-32" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pt-0 pb-5">
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

