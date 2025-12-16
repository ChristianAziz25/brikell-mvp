/**
 * API Route: /api/assets/noi-trend
 * 
 * Returns NOI (GRI - OPEX) trend by year across all assets
 * Optimized using TimescaleDB continuous aggregates
 */

import { getAllYearlyMetricsByAsset } from "@/lib/timescaledb-queries";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const metrics = await getAllYearlyMetricsByAsset();
    
    // Aggregate NOI by year across all assets
    const noiByYear = new Map<number, number>();
    
    metrics.forEach((metric) => {
      const gri = metric.gri ?? 0;
      const opex = metric.opexActual ?? 0;
      const noi = gri - opex;
      
      const current = noiByYear.get(metric.year) ?? 0;
      noiByYear.set(metric.year, current + noi);
    });
    
    const trendData = Array.from(noiByYear.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((a, b) => a.year - b.year);
    
    return NextResponse.json(trendData);
  } catch (error) {
    console.error("Error fetching NOI trend:", error);
    return NextResponse.json(
      { error: "Failed to fetch NOI trend" },
      { status: 500 }
    );
  }
}

