/**
 * API Route: /api/assets/portfolio-summary
 * 
 * Returns portfolio-level aggregated metrics for the current year
 * Optimized with efficient client-side aggregation
 */

import { getAllAssets } from "@/lib/prisma/models/asset";
import { buildAssetTimeSeries } from "@/lib/timeSeriesData";
import { NextResponse } from "next/server";

const CURRENT_YEAR = new Date().getFullYear();

export async function GET() {
  try {
    const assets = await getAllAssets();
    const timeSeries = buildAssetTimeSeries(assets);
    
    // Aggregate current year metrics across all assets
    let capexTotal = 0;
    let opexTotal = 0;
    let griTotal = 0;
    let occupancySum = 0;
    let assetCount = 0;
    
    for (const series of timeSeries) {
      const currentCapex = series.capex.find((c) => c.year === CURRENT_YEAR)?.totalCapexActual ?? 0;
      const currentOpex = series.opex.find((o) => o.year === CURRENT_YEAR)?.totalOpexActual ?? 0;
      const currentGri = series.gri.find((g) => g.year === CURRENT_YEAR)?.gri ?? 0;
      const currentOccupancy = series.occupancy.find((o) => o.year === CURRENT_YEAR)?.occupancyRate ?? 0;
      
      capexTotal += currentCapex;
      opexTotal += currentOpex;
      griTotal += currentGri;
      occupancySum += currentOccupancy;
      assetCount += 1;
    }
    
    const noiTotal = griTotal - opexTotal;
    const noiMarginTotal = griTotal !== 0 ? (noiTotal / griTotal) * 100 : 0;
    const occupancyTotal = assetCount > 0 ? occupancySum / assetCount : 0;
    
    const summary = {
      capexTotal,
      opexTotal,
      griTotal,
      occupancyTotal,
      noiTotal,
      noiMarginTotal,
    };
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching portfolio summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio summary" },
      { status: 500 }
    );
  }
}

