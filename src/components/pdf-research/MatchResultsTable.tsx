"use client";

import { cn } from "@/lib/utils";
import type { MatchedUnit, PdfUnitResult } from "@/lib/pdf-processing/types";

type MatchType = "matched" | "fuzzy" | "missing";

interface TableRow {
  id: string;
  unit: string;
  address: string;
  matchType: MatchType;
  confidence: number | null;
  note: string;
}

interface MatchResultsTableProps {
  matchedUnits: MatchedUnit[];
  missingUnits: PdfUnitResult[];
  className?: string;
}

function getMatchTypeBadge(type: MatchType) {
  const styles: Record<MatchType, string> = {
    matched: "bg-green-50 text-green-700",
    fuzzy: "bg-amber-50 text-amber-700",
    missing: "bg-zinc-100 text-zinc-500",
  };

  const labels: Record<MatchType, string> = {
    matched: "Matched",
    fuzzy: "Fuzzy Match",
    missing: "Not Found",
  };

  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", styles[type])}>
      {labels[type]}
    </span>
  );
}

function getConfidenceDisplay(confidence: number | null) {
  if (confidence === null) {
    return <span className="text-zinc-400">-</span>;
  }

  const percentage = Math.round(confidence * 100);
  const colorClass =
    percentage >= 85
      ? "text-green-600"
      : percentage >= 70
        ? "text-amber-600"
        : "text-red-600";

  return <span className={cn("font-medium", colorClass)}>{percentage}%</span>;
}

function formatUnit(pdfUnit: PdfUnitResult): string {
  if (pdfUnit.door !== null && pdfUnit.floor !== null) {
    return `${pdfUnit.floor}/${pdfUnit.door}`;
  }
  if (pdfUnit.door !== null) {
    return `#${pdfUnit.door}`;
  }
  return pdfUnit.address?.split(",")[0] || "Unit";
}

export function MatchResultsTable({
  matchedUnits,
  missingUnits,
  className,
}: MatchResultsTableProps) {
  // Transform data into table rows
  const rows: TableRow[] = [
    // Matched units
    ...matchedUnits.map((match): TableRow => {
      const isFuzzy = match.confidence < 0.85;
      return {
        id: match.pdfUnit.id,
        unit: formatUnit(match.pdfUnit),
        address: match.dbUnit.address || match.pdfUnit.address || "-",
        matchType: isFuzzy ? "fuzzy" : "matched",
        confidence: match.confidence,
        note: isFuzzy ? "Review recommended" : match.dbUnit.propertyName || "",
      };
    }),
    // Missing units
    ...missingUnits.map((unit): TableRow => ({
      id: unit.id,
      unit: formatUnit(unit),
      address: unit.address || "-",
      matchType: "missing",
      confidence: null,
      note: "Not in portfolio",
    })),
  ];

  if (rows.length === 0) {
    return (
      <div className={cn("text-sm text-zinc-500 text-center py-4", className)}>
        No units found in the document.
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-lg border border-zinc-100", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-50 border-b border-zinc-100">
            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Unit
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Address
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Match Type
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Confidence
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Note
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-zinc-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
              <td className="px-4 py-3 text-zinc-700 font-medium">{row.unit}</td>
              <td className="px-4 py-3 text-zinc-600 max-w-[200px] truncate">
                {row.address}
              </td>
              <td className="px-4 py-3">{getMatchTypeBadge(row.matchType)}</td>
              <td className="px-4 py-3">{getConfidenceDisplay(row.confidence)}</td>
              <td className="px-4 py-3 text-zinc-500 max-w-[150px] truncate">
                {row.note}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
