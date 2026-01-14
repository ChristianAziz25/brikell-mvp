import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AnswerLoadingStateProps {
  className?: string;
}

/**
 * Clean, minimal loading indicator for AI answer generation.
 * Simple spinner - no skeleton, no text.
 */
export function AnswerLoadingState({ className }: AnswerLoadingStateProps) {
  return (
    <div className={cn("flex items-center justify-center py-2", className)}>
      <Loader2 className="h-5 w-5 text-zinc-300 animate-spin" />
    </div>
  );
}
