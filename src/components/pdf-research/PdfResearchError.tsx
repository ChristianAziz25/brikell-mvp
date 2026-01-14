"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfResearchErrorProps {
  message?: string;
  onRetry: () => void;
}

export function PdfResearchError({ message, onRetry }: PdfResearchErrorProps) {
  return (
    <div className="w-full">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-50 rounded-lg shrink-0">
          <AlertCircle className="h-4 w-4 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-700">
            We couldn&apos;t process this document
          </p>
          <p className="text-sm text-zinc-500 mt-1">
            {message || "Please try uploading again or contact support if the issue persists."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-3"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
