/**
 * API Route: /api/asset/yearly-metrics
 * 
 * Returns yearly aggregated metrics for a single asset
 * Optimized using TimescaleDB continuous aggregates
 */

import { getAllYearlyMetricsByAsset } from "@/lib/timescaledb-queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assetName = searchParams.get("name");

  if (!assetName) {
    return NextResponse.json(
      { error: "Asset name is required" },
      { status: 400 }
    );
  }

  try {
    const metrics = await getAllYearlyMetricsByAsset();
    const assetMetrics = metrics.filter(m => m.assetName === assetName);
    
    // Transform to the format expected by performance page
    const yearBasedData = assetMetrics.map(m => ({
      year: m.year,
      capex: m.capexActual ?? 0,
      opex: m.opexActual ?? 0,
      tri: m.gri ?? 0, // GRI is TRI - vacancy loss, which is what we want
      occupancy: m.occupancyRate ?? 0,
    })).sort((a, b) => a.year - b.year);
    
    return NextResponse.json(yearBasedData);
  } catch (error) {
    console.error("Error fetching asset yearly metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset yearly metrics" },
      { status: 500 }
    );
  }
}

