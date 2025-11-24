import { Search, Send } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function Chat() {
  return (
    <div className="bg-card text-card-foreground p-8 shadow-sm border rounded-2xl">
      <div className="space-y-6">
        <h1 className="text-xl font-medium text-center text-foreground">
          What would you like to know?
        </h1>
        <p className="text-center text-muted-foreground text-sm">
          Ask anything about your properties, tenants, or financials
        </p>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="flex w-full border px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-11 h-12 text-sm bg-muted/30 border-border/50 focus:bg-background rounded-xl"
            placeholder="Type your question here..."
          />
          <Button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 px-3 absolute right-2 top-1/2 transform -translate-y-1/2 h-8 bg-foreground text-background hover:bg-foreground/90 rounded-lg">
            Ask
          </Button>
        </div>
      </div>
    </div>
  );
}
