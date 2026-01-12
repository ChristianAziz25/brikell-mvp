"use client";

import { cn } from "@/lib/utils";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "./button";

interface PdfUploadProps {
  onUpload: (file: File) => void;
  isLoading?: boolean;
  className?: string;
}

export function PdfUpload({ onUpload, isLoading = false, className }: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    if (!file.type.includes("pdf")) {
      setError("Please upload a PDF file");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError("File size must be less than 10MB");
      return false;
    }
    setError(null);
    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleClearFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 transition-all duration-200",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 bg-muted/5 hover:border-muted-foreground/50 hover:bg-muted/10",
            isLoading && "pointer-events-none opacity-50"
          )}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/50">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground">
              Drop your PDF here
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse
            </p>
          </div>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Supports PDF files up to 10MB
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          {!isLoading && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearFile}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {selectedFile && (
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing document...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Extract Data
            </>
          )}
        </Button>
      )}
    </div>
  );
}
