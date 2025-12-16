/**
 * API Route: /api/assets/portfolio-summary
 * 
 * Returns portfolio-level aggregated metrics for the current year
 * Optimized using TimescaleDB continuous aggregates
 */

import { getAllYearlyMetricsByAsset } from "@/lib/timescaledb-queries";
import { NextResponse } from "next/server";

const CURRENT_YEAR = new Date().getFullYear();

export async function GET() {
  try {
    const metrics = await getAllYearlyMetricsByAsset();
    
    // Filter to current year and aggregate across all assets
    const currentYearMetrics = metrics.filter(m => m.year === CURRENT_YEAR);
    
    const summary = {
      capexTotal: currentYearMetrics.reduce((sum, m) => sum + (m.capexActual ?? 0), 0),
      opexTotal: currentYearMetrics.reduce((sum, m) => sum + (m.opexActual ?? 0), 0),
      griTotal: currentYearMetrics.reduce((sum, m) => sum + (m.gri ?? 0), 0),
      occupancyTotal: currentYearMetrics.reduce((sum, m) => sum + (m.occupancyRate ?? 0), 0) / currentYearMetrics.length,
      noiTotal: 0,
      noiMarginTotal: 0,
    };
    
    summary.noiTotal = summary.griTotal - summary.opexTotal;
    summary.noiMarginTotal = summary.griTotal !== 0 
      ? (summary.noiTotal / summary.griTotal) * 100 
      : 0;
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching portfolio summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio summary" },
      { status: 500 }
    );
  }
}

