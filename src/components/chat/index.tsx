import { SearchIcon, SendIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function Chat() {
  return (
    <div className="w-full border border-primary-border rounded-lg p-4">
      <h1>What would you like to know?</h1>
      <p>Ask anything about your properties, tenants, or financials</p>
      <div className="relative">
        <Input className="w-full bg-input-background-color pl-4 pr-12"></Input>
        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4" />
        <Button className="absolute h-6 w-5 right-2 top-1/2 -translate-y-1/2">
          <SendIcon className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
