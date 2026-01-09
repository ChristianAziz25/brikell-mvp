import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function HelpLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search card */}
      <Card className="shadow-card">
        <CardContent className="p-6 pt-6">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Help Articles */}
        <Card className="shadow-card">
          <CardHeader className="p-6 pb-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card className="shadow-card">
          <CardHeader className="p-6 pb-3">
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="p-6 pt-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Contact Support */}
      <Card className="shadow-card">
        <CardContent className="p-6 text-center space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40 mx-auto" />
            <Skeleton className="h-4 w-72 mx-auto" />
          </div>
          <div className="flex justify-center gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

