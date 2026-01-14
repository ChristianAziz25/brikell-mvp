"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  JobStatusResponse,
  JobResultsResponse,
  JobStatus,
} from "@/lib/pdf-processing/types";

interface UsePdfJobOptions {
  /** Polling interval in milliseconds (default: 2000) */
  pollInterval?: number;
  /** Whether to automatically fetch results when job completes (default: true) */
  autoFetchResults?: boolean;
  /** Callback when job completes */
  onComplete?: (results: JobResultsResponse) => void;
  /** Callback when job fails */
  onError?: (error: Error) => void;
}

interface UsePdfJobReturn {
  /** Current job status */
  job: JobStatusResponse | null;
  /** Job results (only available when completed) */
  results: JobResultsResponse | null;
  /** Whether the initial fetch is loading */
  isLoading: boolean;
  /** Whether the job is being polled */
  isPolling: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Manually refetch the job status */
  refetch: () => Promise<JobStatusResponse | undefined>;
  /** Upload a new PDF and start tracking */
  uploadPdf: (file: File, assetId?: string) => Promise<string | null>;
}

const TERMINAL_STATES: JobStatus[] = ["completed", "failed"];

export function usePdfJob(
  jobId: string | null,
  options: UsePdfJobOptions = {}
): UsePdfJobReturn {
  const {
    pollInterval = 2000,
    autoFetchResults = true,
    onComplete,
    onError,
  } = options;

  const [job, setJob] = useState<JobStatusResponse | null>(null);
  const [results, setResults] = useState<JobResultsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use refs for callbacks to avoid effect dependencies
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  // Fetch job status
  const fetchJob = useCallback(async () => {
    if (!jobId) return;

    try {
      const res = await fetch(`/api/pdf-jobs/${jobId}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch job: ${res.status}`);
      }

      const data: JobStatusResponse = await res.json();
      setJob(data);
      setError(null);

      // Fetch results when completed
      if (data.status === "completed" && autoFetchResults && !results) {
        const resultsRes = await fetch(`/api/pdf-jobs/${jobId}/results`);
        if (resultsRes.ok) {
          const resultsData: JobResultsResponse = await resultsRes.json();
          setResults(resultsData);
          onCompleteRef.current?.(resultsData);
        }
      }

      // Handle failure
      if (data.status === "failed" && data.errorMessage) {
        const err = new Error(data.errorMessage);
        onErrorRef.current?.(err);
      }

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      onErrorRef.current?.(error);
      throw error;
    }
  }, [jobId, autoFetchResults, results]);

  // Initial fetch
  useEffect(() => {
    if (jobId) {
      setIsLoading(true);
      setJob(null);
      setResults(null);
      setError(null);

      fetchJob().finally(() => setIsLoading(false));
    }
  }, [jobId, fetchJob]);

  // Polling for non-terminal states
  useEffect(() => {
    if (!jobId || !job) return;

    const shouldPoll = !TERMINAL_STATES.includes(job.status);

    if (shouldPoll) {
      setIsPolling(true);

      const interval = setInterval(() => {
        fetchJob().catch(() => {
          // Error is already handled in fetchJob
        });
      }, pollInterval);

      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    } else {
      setIsPolling(false);
    }
  }, [jobId, job?.status, pollInterval, fetchJob]);

  // Upload PDF and return job ID
  const uploadPdf = useCallback(
    async (file: File, assetId?: string): Promise<string | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);
        if (assetId) {
          formData.append("assetId", assetId);
        }

        const res = await fetch("/api/pdf-jobs", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to upload PDF");
        }

        const data = await res.json();
        return data.jobId;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed");
        setError(error);
        onErrorRef.current?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    job,
    results,
    isLoading,
    isPolling,
    error,
    refetch: fetchJob,
    uploadPdf,
  };
}

/**
 * Hook to just upload a PDF without tracking
 */
export function usePdfUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    async (file: File, assetId?: string): Promise<string | null> => {
      try {
        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);
        if (assetId) {
          formData.append("assetId", assetId);
        }

        const res = await fetch("/api/pdf-jobs", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to upload PDF");
        }

        const data = await res.json();
        return data.jobId;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed");
        setError(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return { upload, isUploading, error };
}
