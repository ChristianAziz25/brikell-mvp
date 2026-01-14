"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { PulsingDots } from "./PulsingDots";
import type { JobStatus } from "@/lib/pdf-processing/types";

const STATUS_MESSAGES: Record<JobStatus, string> = {
  pending: "Searching for relevant data sources...",
  processing: "Analyzing document structure...",
  extracting: "Extracting units from PDF...",
  matching: "Matching against your portfolio...",
  completed: "Finalizing results...",
  failed: "Something went wrong",
};

const LONG_WAIT_THRESHOLD_MS = 15000; // 15 seconds
const LONG_WAIT_MESSAGE = "This is taking longer than usual. Still processing...";

interface PdfResearchLoadingProps {
  status: JobStatus;
  progress: number;
  startTime?: number;
}

export function PdfResearchLoading({ status, progress, startTime }: PdfResearchLoadingProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const statusText = STATUS_MESSAGES[status] || "Processing...";

  // Track elapsed time for timeout message
  useEffect(() => {
    const start = startTime || Date.now();

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - start);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const isLongWait = elapsedTime > LONG_WAIT_THRESHOLD_MS;

  return (
    <div className="w-full space-y-6">
      {/* Status indicator with spinner */}
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 text-zinc-400 animate-spin" />
        <TextShimmer
          as="span"
          className="text-sm text-zinc-500"
          duration={2.5}
        >
          {statusText}
        </TextShimmer>
        <PulsingDots className="ml-1" />
      </div>

      {/* Long wait message */}
      {isLongWait && (
        <div className="text-sm text-zinc-400 font-semibold">
          {LONG_WAIT_MESSAGE}
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-zinc-300 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Skeleton for summary card */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2 pl-4">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>

      {/* Skeleton for results table */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <div className="border border-zinc-100 rounded-lg overflow-hidden">
          {/* Table header */}
          <div className="bg-zinc-50 px-4 py-2 flex gap-4">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          {/* Table rows */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-4 py-3 flex gap-4 border-t border-zinc-100">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
