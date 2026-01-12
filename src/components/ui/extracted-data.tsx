"use client";

import type { ExtractedData } from "@/app/api/parse-pdf/route";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Check,
  Copy,
  DollarSign,
  FileText,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Skeleton } from "./skeleton";

interface ExtractedDataDisplayProps {
  data: ExtractedData | null;
  fileName?: string;
  isLoading?: boolean;
  className?: string;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-6 w-6 text-muted-foreground hover:text-foreground"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
}

function DataItem({
  label,
  value,
  showCopy = true,
}: {
  label: string;
  value: string;
  showCopy?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-foreground">{value}</span>
        {showCopy && <CopyButton value={value} />}
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function ExtractedDataDisplay({
  data,
  fileName,
  isLoading,
  className,
}: ExtractedDataDisplayProps) {
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-6 w-48" />
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const documentTypeLabels = {
    financial_statement: "Financial Statement",
    contract: "Contract / Lease Agreement",
    other: "Document",
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {fileName || "Document Analysis"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {documentTypeLabels[data.documentType]}
          </p>
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-foreground leading-relaxed">
              {data.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Financial Data */}
      {data.financials && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Financial Data
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {data.financials.revenue && (
              <DataItem
                label={`Revenue (${data.financials.revenue.period})`}
                value={formatCurrency(data.financials.revenue.value)}
              />
            )}
            {data.financials.expenses && (
              <DataItem
                label={`Expenses (${data.financials.expenses.period})`}
                value={formatCurrency(data.financials.expenses.value)}
              />
            )}
            {data.financials.netIncome && (
              <DataItem
                label={`Net Income (${data.financials.netIncome.period})`}
                value={formatCurrency(data.financials.netIncome.value)}
              />
            )}
            {data.financials.otherMetrics?.map((metric, index) => (
              <DataItem
                key={index}
                label={metric.label}
                value={metric.value}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Parties */}
      {data.parties && data.parties.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Parties Involved
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {data.parties.map((party, index) => (
              <DataItem key={index} label={party.role} value={party.name} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dates */}
      {data.dates && data.dates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              Important Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {data.dates.map((date, index) => (
              <DataItem key={index} label={date.label} value={date.date} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Key Terms */}
      {data.keyTerms && data.keyTerms.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              Key Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {data.keyTerms.map((term, index) => (
              <DataItem key={index} label={term.term} value={term.value} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Raw Text Fallback */}
      {data.rawText && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Extracted Text Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted/30 p-3 rounded-md max-h-48 overflow-y-auto">
              {data.rawText}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
