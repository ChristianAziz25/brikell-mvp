/**
 * API Route: /api/assets/noi-trend
 * 
 * Returns NOI (GRI - OPEX) trend by year across all assets
 * Optimized with efficient client-side aggregation
 */

import { getAllAssets } from "@/lib/prisma/models/asset";
import { buildAssetTimeSeries } from "@/lib/timeSeriesData";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const assets = await getAllAssets();
    const timeSeries = buildAssetTimeSeries(assets);
    
    // Aggregate NOI by year across all assets
    const noiByYear = new Map<number, number>();
    
    for (const series of timeSeries) {
      // Build OPEX map by year for this asset
      const opexByYear = new Map<number, number>();
      series.opex.forEach((opex) => {
        opexByYear.set(opex.year, opex.totalOpexActual);
      });
      
      // Calculate NOI for each GRI year
      series.gri.forEach((gri) => {
        const opexForYear = opexByYear.get(gri.year) ?? 0;
        const noi = gri.gri - opexForYear;
        const current = noiByYear.get(gri.year) ?? 0;
        noiByYear.set(gri.year, current + noi);
      });
    }
    
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

