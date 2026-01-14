/**
 * Fast PDF Research Panel
 *
 * PERFORMANCE OPTIMIZATION: Uses client-side PDF parsing with server-side
 * LLM extraction. No file upload to storage required.
 *
 * This component:
 * - Takes a File object directly (not a jobId)
 * - Parses PDF in browser using pdf.js
 * - Streams extracted text to server for LLM processing
 * - Shows the SAME loading states as PdfResearchPanel
 * - Returns the SAME results format
 *
 * The existing loading UI (skeletons, "Searching for relevant data sources...", etc.)
 * remains exactly the same - only the underlying processing is faster.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useFastPdfParse } from "@/hooks/use-fast-pdf-parse";
import { PdfResearchLoading } from "./PdfResearchLoading";
import { PdfResearchResults } from "./PdfResearchResults";
import { PdfResearchError } from "./PdfResearchError";
import type { DDResultsResponse } from "@/lib/pdf-processing/types";

interface FastPdfResearchPanelProps {
  /** The PDF file to parse */
  file: File;
  /** Called when results are ready */
  onComplete?: (results: DDResultsResponse) => void;
  /** Called to dismiss the panel */
  onDismiss?: () => void;
  /** Called to retry with the same or a new file */
  onRetry?: (file: File) => void;
  /** Optional asset ID to scope matching */
  assetId?: string;
}

export function FastPdfResearchPanel({
  file,
  onComplete,
  onDismiss,
  onRetry,
  assetId,
}: FastPdfResearchPanelProps) {
  const startTimeRef = useRef<number>(Date.now());
  const [showResults, setShowResults] = useState(false);
  const hasStartedRef = useRef(false);

  const { parsePdf, job, results, error, reset } = useFastPdfParse({
    assetId,
    onComplete: (results) => {
      // Small delay before showing results for smoother transition
      setTimeout(() => {
        setShowResults(true);
        onComplete?.(results);
      }, 100);
    },
  });

  // Start parsing when file is provided (only once)
  useEffect(() => {
    if (file && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startTimeRef.current = Date.now();
      parsePdf(file);
    }
  }, [file, parsePdf]);

  // Reset when file changes
  useEffect(() => {
    return () => {
      hasStartedRef.current = false;
    };
  }, [file]);

  const handleRetry = useCallback(() => {
    reset();
    hasStartedRef.current = false;
    setShowResults(false);
    startTimeRef.current = Date.now();
    onRetry?.(file);
  }, [file, reset, onRetry]);

  // Initial loading state before first progress update
  if (!job) {
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

  // Error state
  if (error || job.status === "failed") {
    return (
      <div className="w-full bg-zinc-50 rounded-xl shadow-sm border border-zinc-100 px-5 py-4">
        <PdfResearchError
          message={error?.message || job.errorMessage || "Processing failed"}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  const isProcessing = ["pending", "processing", "extracting", "matching"].includes(
    job.status
  );
  const isCompleted = job.status === "completed" && results;

  return (
    <div className="w-full bg-zinc-50 rounded-xl shadow-sm border border-zinc-100 px-5 py-4 relative">
      {/* Dismiss button (only show when completed) */}
      {isCompleted && onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 rounded-md hover:bg-zinc-200 transition-colors z-10"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-zinc-400" />
        </button>
      )}

      {/* Loading state - SAME UI as before */}
      {isProcessing && (
        <PdfResearchLoading
          status={job.status}
          progress={job.progress}
          startTime={startTimeRef.current}
        />
      )}

      {/* Results state with fade-in - SAME UI as before */}
      {isCompleted && showResults && <PdfResearchResults results={results} />}

      {/* Brief transition state */}
      {isCompleted && !showResults && (
        <PdfResearchLoading
          status="completed"
          progress={100}
          startTime={startTimeRef.current}
        />
      )}
    </div>
  );
}
