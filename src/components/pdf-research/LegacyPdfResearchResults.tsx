"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { JobResultsResponse } from "@/lib/pdf-processing/types";

interface LegacyPdfResearchResultsProps {
  results: JobResultsResponse;
}

/**
 * Results component for the legacy job-based PDF parsing flow
 * Displays unit matching results (matchedUnits, missingInDb, extraInDb)
 */
export function LegacyPdfResearchResults({ results }: LegacyPdfResearchResultsProps) {
  const { stats, missingInDb, summary } = results;
  const hasAnomalies = missingInDb.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="w-full space-y-6"
    >
      {/* Completion header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex items-center gap-2 pb-4 border-b border-zinc-200"
      >
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <span className="text-sm font-semibold text-zinc-800">
          Unit Matching Analysis Complete
        </span>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-zinc-800">{stats.totalPdfUnits}</div>
          <div className="text-xs text-zinc-500">PDF Units</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.matched}</div>
          <div className="text-xs text-zinc-500">Matched</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">{stats.missing}</div>
          <div className="text-xs text-zinc-500">Missing</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-zinc-600">{stats.extra}</div>
          <div className="text-xs text-zinc-500">Extra in DB</div>
        </div>
      </div>

      {/* Anomaly Status */}
      {!hasAnomalies ? (
        <div className="flex items-center gap-2 text-green-600 p-3 bg-green-50 rounded-lg">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">No Anomalies Detected</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-medium">
              {missingInDb.length} Unit{missingInDb.length !== 1 ? "s" : ""} Not Found
              in Database
            </span>
          </div>

          {/* Missing units table */}
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-zinc-100">
                {missingInDb.slice(0, 10).map((unit) => (
                  <tr key={unit.id} className="hover:bg-zinc-50">
                    <td className="px-3 py-2 text-zinc-700">{unit.address || "-"}</td>
                    <td className="px-3 py-2 text-zinc-600">
                      {unit.floor !== null && unit.door !== null
                        ? `${unit.floor}/${unit.door}`
                        : "-"}
                    </td>
                    <td className="px-3 py-2 text-zinc-600">
                      {unit.sizeSqm ? `${unit.sizeSqm} m²` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {missingInDb.length > 10 && (
              <div className="px-3 py-2 text-xs text-zinc-500 bg-zinc-50 border-t">
                + {missingInDb.length - 10} more units
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-800 uppercase tracking-wide">
            Summary
          </h3>
          <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
            {summary}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-zinc-200">
        <p className="text-xs text-zinc-400">
          Document: {results.fileName} •{" "}
          {results.completedAt
            ? `Analyzed: ${new Date(results.completedAt).toLocaleString()}`
            : "Analysis complete"}
        </p>
      </div>
    </motion.div>
  );
}
