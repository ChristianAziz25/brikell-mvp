"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { usePdfJob } from "@/hooks/use-pdf-job";
import { PdfResearchLoading } from "./PdfResearchLoading";
import { LegacyPdfResearchResults } from "./LegacyPdfResearchResults";
import { PdfResearchError } from "./PdfResearchError";

interface PdfResearchPanelProps {
  jobId: string;
  onDismiss?: () => void;
  onRetry?: (file: File) => void;
}

export function PdfResearchPanel({
  jobId,
  onDismiss,
  onRetry,
}: PdfResearchPanelProps) {
  // Track when the job started for timeout messaging
  const startTimeRef = useRef<number>(Date.now());
  const [showResults, setShowResults] = useState(false);

  const { job, results, isLoading, error } = usePdfJob(jobId, {
    pollInterval: 1500, // Faster polling (1.5s instead of 2s)
    autoFetchResults: true,
    onComplete: () => {
      // Small delay before showing results for smoother transition
      setTimeout(() => setShowResults(true), 100);
    },
  });

  const handleRetry = useCallback(() => {
    onRetry?.(new File([], ""));
  }, [onRetry]);

  // Reset showResults when jobId changes
  useEffect(() => {
    setShowResults(false);
    startTimeRef.current = Date.now();
  }, [jobId]);

  // Loading state before first job fetch
  if (isLoading && !job) {
    return (
      <div className="w-full bg-zinc-50 rounded-xl shadow-sm border border-zinc-100 px-5 py-4">
        <PdfResearchLoading
          status="pending"
          progress={0}
          startTime={startTimeRef.current}
        />
      </div>
    );
  }

  // Error from fetch itself
  if (error && !job) {
    return (
      <div className="w-full bg-zinc-50 rounded-xl shadow-sm border border-zinc-100 px-5 py-4">
        <PdfResearchError message={error.message} onRetry={handleRetry} />
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const isProcessing = ["pending", "processing", "extracting", "matching"].includes(
    job.status
  );
  const isCompleted = job.status === "completed" && results;
  const isFailed = job.status === "failed";

  return (
    <div className="w-full bg-zinc-50 rounded-xl shadow-sm border border-zinc-100 px-5 py-4 relative">
      {/* Dismiss button (only show when completed or failed) */}
      {(isCompleted || isFailed) && onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 rounded-md hover:bg-zinc-200 transition-colors z-10"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-zinc-400" />
        </button>
      )}

      {/* Loading state */}
      {isProcessing && (
        <PdfResearchLoading
          status={job.status}
          progress={job.progress}
          startTime={startTimeRef.current}
        />
      )}

      {/* Results state with fade-in */}
      {isCompleted && showResults && (
        <LegacyPdfResearchResults results={results} />
      )}

      {/* Brief transition state - show loading briefly before results fade in */}
      {isCompleted && !showResults && (
        <PdfResearchLoading
          status="completed"
          progress={100}
          startTime={startTimeRef.current}
        />
      )}

      {/* Error state */}
      {isFailed && (
        <PdfResearchError message={job.errorMessage} onRetry={handleRetry} />
      )}
    </div>
  );
}
