"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { DDResultsWithUnits } from "@/lib/pdf-processing/types";
import { UnitMatchingResults } from "./UnitMatchingResults";

interface PdfResearchResultsProps {
  results: DDResultsWithUnits;
}

export function PdfResearchResults({ results }: PdfResearchResultsProps) {
  const { summary, unitMatching } = results;

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
        <span className="text-sm font-semibold text-zinc-800">Due Diligence Analysis Complete</span>
      </motion.div>

      {/* Structured DD Summary */}
      <div className="space-y-6">
        {/* Property Overview */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-800 uppercase tracking-wide">Property Overview</h3>
          <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
            {summary.propertyOverview}
          </p>
        </div>

        {/* Key Financials */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-800 uppercase tracking-wide">Key Financials</h3>
          <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
            {summary.keyFinancials}
          </p>
        </div>

        {/* Rent Roll Highlights */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-800 uppercase tracking-wide">Rent Roll Highlights</h3>
          <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
            {summary.rentRollHighlights}
          </p>
        </div>

        {/* Risks & Red Flags */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-800 uppercase tracking-wide">Risks & Red Flags</h3>
          <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
            {summary.risksAndRedFlags}
          </p>
        </div>

        {/* Missing Information */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-800 uppercase tracking-wide">Missing Information</h3>
          <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
            {summary.missingInformation}
          </p>
        </div>

        {/* Unit Matching Results */}
        {unitMatching && <UnitMatchingResults results={unitMatching} />}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-zinc-200">
        <p className="text-xs text-zinc-400">
          Document: {results.fileName} • Analyzed: {new Date(results.completedAt).toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
}
