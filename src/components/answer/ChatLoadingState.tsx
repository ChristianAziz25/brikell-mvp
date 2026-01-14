"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { PulsingDots } from "@/components/pdf-research";
import { cn } from "@/lib/utils";

const LOADING_STAGES = [
  { message: "Analyzing your question...", duration: 1000 },
  { message: "Searching database...", duration: 1500 },
  { message: "Processing data...", duration: 1500 },
  { message: "Generating response...", duration: 2000 },
];

interface ChatLoadingStateProps {
  className?: string;
}

/**
 * Clean loading indicator for chat questions with progress stages.
 * Shows different stages similar to deep research but cleaner.
 */
export function ChatLoadingState({ className }: ChatLoadingStateProps) {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    let accumulatedTime = 0;

    const intervals = LOADING_STAGES.map((stage, index) => {
      accumulatedTime += stage.duration;
      return setTimeout(() => {
        if (index < LOADING_STAGES.length - 1) {
          setCurrentStage(index + 1);
        }
      }, accumulatedTime);
    });

    return () => {
      intervals.forEach(clearTimeout);
    };
  }, []);

  const currentMessage = LOADING_STAGES[currentStage]?.message || "Generating response...";

  return (
    <div className={cn("space-y-3", className)}>
      {/* Status indicator with spinner */}
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 text-zinc-400 animate-spin" />
        <TextShimmer
          as="span"
          className="text-sm text-zinc-500"
          duration={2.5}
        >
          {currentMessage}
        </TextShimmer>
        <PulsingDots className="ml-1" />
      </div>

      {/* Progress indicator */}
      <div className="w-full h-0.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-zinc-300 rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${Math.min(((currentStage + 1) / LOADING_STAGES.length) * 100, 95)}%`,
          }}
        />
      </div>
    </div>
  );
}
