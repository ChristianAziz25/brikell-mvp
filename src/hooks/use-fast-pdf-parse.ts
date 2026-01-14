/**
 * Fast PDF Parse Hook
 *
 * PERFORMANCE OPTIMIZATION: This hook combines client-side PDF parsing with
 * server-side LLM extraction for maximum speed.
 *
 * Flow:
 * 1. User selects PDF file
 * 2. pdf.js extracts text in browser (no upload!)
 * 3. Text is streamed to /api/pdf-parse-fast
 * 4. Server does LLM extraction + matching
 * 5. Results streamed back in real-time
 *
 * Benefits:
 * - No file upload to storage (saves ~2-5 seconds)
 * - Real-time progress updates
 * - Client-side parsing is parallel
 * - Same loading UI as before
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { parseClientPdf, type ClientParseResult } from "@/lib/pdf-processing/client-parser";
import type {
  JobStatus,
  DDResultsResponse,
  JobStatusResponse,
} from "@/lib/pdf-processing/types";

interface UseFastPdfParseOptions {
  /** Callback when processing completes */
  onComplete?: (results: DDResultsResponse) => void;
  /** Callback when processing fails */
  onError?: (error: Error) => void;
  /** Asset ID (not used for DD summary, kept for compatibility) */
  assetId?: string;
}

interface UseFastPdfParseReturn {
  /** Start parsing a PDF file */
  parsePdf: (file: File) => Promise<void>;
  /** Current job status (compatible with usePdfJob) */
  job: JobStatusResponse | null;
  /** Final results (when complete) */
  results: DDResultsResponse | null;
  /** Whether currently processing */
  isProcessing: boolean;
  /** Current error if any */
  error: Error | null;
  /** Reset state for new parse */
  reset: () => void;
}

/**
 * Hook for fast PDF parsing with client-side extraction
 *
 * Returns state compatible with existing PdfResearchPanel components
 */
export function useFastPdfParse(
  options: UseFastPdfParseOptions = {}
): UseFastPdfParseReturn {
  const { onComplete, onError, assetId } = options;

  // State that matches usePdfJob return type
  const [job, setJob] = useState<JobStatusResponse | null>(null);
  const [results, setResults] = useState<DDResultsResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs for callbacks
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    // Cancel any in-progress request
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    setJob(null);
    setResults(null);
    setIsProcessing(false);
    setError(null);
  }, []);

  const parsePdf = useCallback(
    async (file: File) => {
      // Reset state
      reset();
      setIsProcessing(true);

      // Create fake job for loading state (matches JobStatusResponse interface)
      const fakeJobId = `fast-${Date.now()}`;
      setJob({
        id: fakeJobId,
        status: "pending",
        progress: 0,
        fileName: file.name,
        createdAt: new Date().toISOString(),
        retryCount: 0,
      });

      try {
        // PHASE 1: Client-side PDF extraction (no network!)
        setJob((prev) =>
          prev
            ? {
                ...prev,
                status: "processing" as JobStatus,
                progress: 5,
              }
            : null
        );

        const parseResult: ClientParseResult = await parseClientPdf(
          file,
          (progress, _status) => {
            // Map client progress (0-100) to our progress (5-30)
            const mappedProgress = 5 + (progress / 100) * 25;
            setJob((prev) =>
              prev
                ? {
                    ...prev,
                    status: "extracting" as JobStatus,
                    progress: Math.round(mappedProgress),
                  }
                : null
            );
          }
        );

        // PHASE 2: Send to server for LLM extraction + matching
        setJob((prev) =>
          prev
            ? {
                ...prev,
                status: "extracting" as JobStatus,
                progress: 35,
              }
            : null
        );

        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/pdf-parse-fast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: parseResult.fullText,
            fileName: file.name,
            pageCount: parseResult.metadata.pageCount,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Server processing failed");
        }

        // PHASE 3: Stream response for real-time updates
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process SSE events
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "results") {
                // Final results received
                setResults(data.data);
                setJob((prev) =>
                  prev
                    ? {
                        ...prev,
                        status: "completed",
                        progress: 100,
                        completedAt: data.data.completedAt,
                      }
                    : null
                );
                onCompleteRef.current?.(data.data);
              } else if (data.status) {
                // Progress update
                // Map server progress (0-100) to our progress (35-100)
                const mappedProgress = 35 + (data.progress / 100) * 65;
                setJob((prev) =>
                  prev
                    ? {
                        ...prev,
                        status: data.status,
                        progress: Math.round(Math.min(mappedProgress, 99)),
                      }
                    : null
                );

                if (data.status === "failed") {
                  throw new Error(data.message || "Processing failed");
                }
              }
            } catch (parseError) {
              // Ignore parse errors for incomplete chunks
              if (parseError instanceof SyntaxError) continue;
              throw parseError;
            }
          }
        }
      } catch (err) {
        // Don't report abort errors
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        setJob((prev) =>
          prev
            ? {
                ...prev,
                status: "failed",
                errorMessage: error.message,
              }
            : null
        );
        onErrorRef.current?.(error);
      } finally {
        setIsProcessing(false);
        abortControllerRef.current = null;
      }
    },
    [assetId, reset]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    parsePdf,
    job,
    results,
    isProcessing,
    error,
    reset,
  };
}

/**
 * Hook that wraps useFastPdfParse to match usePdfJob interface
 * Use this as a drop-in replacement for usePdfJob when using fast parsing
 */
export function useFastPdfJob(
  options: UseFastPdfParseOptions = {}
): UseFastPdfParseReturn & {
  uploadPdf: (file: File, assetId?: string) => Promise<string | null>;
  isLoading: boolean;
  isPolling: boolean;
  refetch: () => Promise<void>;
} {
  const fastParse = useFastPdfParse(options);

  // Compatibility wrapper for uploadPdf
  const uploadPdf = useCallback(
    async (file: File, assetId?: string): Promise<string | null> => {
      await fastParse.parsePdf(file);
      return fastParse.job?.id || null;
    },
    [fastParse]
  );

  return {
    ...fastParse,
    uploadPdf,
    isLoading: fastParse.isProcessing && !fastParse.job,
    isPolling: fastParse.isProcessing,
    refetch: async () => {
      // No-op for fast parse (no polling needed)
    },
  };
}
