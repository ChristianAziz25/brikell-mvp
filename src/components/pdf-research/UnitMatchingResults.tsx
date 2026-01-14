"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Building2 } from "lucide-react";
import type { UnitMatchResult, ExtractedUnit } from "@/lib/pdf-processing/types";

interface UnitMatchingResultsProps {
  results: UnitMatchResult;
}

export function UnitMatchingResults({ results }: UnitMatchingResultsProps) {
  const { unmatchedUnits, matchedCount, totalExtracted, hasAnomalies } = results;

  // No units found case
  if (totalExtracted === 0) {
    return (
      <div className="border-t border-zinc-200 pt-4 mt-4">
        <div className="flex items-center gap-2 text-zinc-500">
          <Building2 className="h-4 w-4" />
          <span className="text-sm">No unit data found in document</span>
        </div>
      </div>
    );
  }

  // All units matched - no anomalies
  if (!hasAnomalies) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-t border-zinc-200 pt-4 mt-4"
      >
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">No Anomalies Detected</span>
        </div>
        <p className="text-sm text-zinc-500 mt-1">
          All {matchedCount} units from the document match records in your database.
        </p>
      </motion.div>
    );
  }

  // Anomalies found - show unmatched units
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-zinc-200 pt-4 mt-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 text-amber-600 mb-3">
        <AlertTriangle className="h-5 w-5" />
        <span className="text-sm font-medium">
          {unmatchedUnits.length} Unit{unmatchedUnits.length !== 1 ? "s" : ""} Not
          Found in Database
        </span>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-zinc-500 mb-3">
        <span>Total extracted: {totalExtracted}</span>
        <span>Matched: {matchedCount}</span>
        <span className="text-amber-600">Unmatched: {unmatchedUnits.length}</span>
      </div>

      {/* Unmatched units table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-100">
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 uppercase">
                Address
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 uppercase">
                Floor/Door
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 uppercase">
                Size
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 uppercase">
                Zipcode
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-100">
            {unmatchedUnits.map((unit, idx) => (
              <tr key={idx} className="hover:bg-zinc-50">
                <td className="px-3 py-2 text-zinc-700">
                  {unit.unit_address || "-"}
                </td>
                <td className="px-3 py-2 text-zinc-600">
                  {formatFloorDoor(unit.unit_floor, unit.unit_door)}
                </td>
                <td className="px-3 py-2 text-zinc-600">
                  {unit.size_sqm ? `${unit.size_sqm} m²` : "-"}
                </td>
                <td className="px-3 py-2 text-zinc-600">
                  {unit.unit_zipcode || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function formatFloorDoor(floor?: number, door?: number): string {
  if (floor !== undefined && door !== undefined) {
    return `${floor}/${door}`;
  }
  if (floor !== undefined) return `Floor ${floor}`;
  if (door !== undefined) return `#${door}`;
  return "-";
}
