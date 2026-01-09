import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* User message */}
        <div className="flex justify-end">
          <div className="max-w-[80%] space-y-2">
            <Skeleton className="h-4 w-32 ml-auto" />
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-full bg-primary-foreground/20" />
                <Skeleton className="h-4 w-3/4 mt-2 bg-primary-foreground/20" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI message */}
        <div className="flex justify-start">
          <div className="max-w-[80%] space-y-2">
            <Skeleton className="h-4 w-24" />
            <Card>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* User message */}
        <div className="flex justify-end">
          <div className="max-w-[80%] space-y-2">
            <Skeleton className="h-4 w-32 ml-auto" />
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-40 bg-primary-foreground/20" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI message with chart */}
        <div className="flex justify-start">
          <div className="max-w-[80%] space-y-2">
            <Skeleton className="h-4 w-24" />
            <Card>
              <CardContent className="p-4 space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-48 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

