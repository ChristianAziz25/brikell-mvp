/**
 * API Route: /api/opex/aggregated
 * 
 * Returns aggregated OPEX data by year and category
 * Optimized using TimescaleDB continuous aggregates
 */

import { getYearlyOpexByAsset } from "@/lib/timescaledb-queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const building = searchParams.get("building");

  try {
    const opexData = await getYearlyOpexByAsset();
    
    // Filter by building if specified
    let filtered = opexData;
    if (building && building !== "All Buildings") {
      filtered = opexData.filter(d => d.assetName === building);
    }
    
    // Get latest year
    const latestYear = filtered.length > 0
      ? Math.max(...filtered.map(d => d.year))
      : null;
    
    // Get latest year data
    const latestYearData = latestYear
      ? filtered.filter(d => d.year === latestYear)
      : [];
    
    // Aggregate by year for trend
    const yearTotals = new Map<number, number>();
    filtered.forEach(d => {
      const current = yearTotals.get(d.year) ?? 0;
      yearTotals.set(d.year, current + d.totalActual);
    });
    
    const trendData = Array.from(yearTotals.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((a, b) => a.year - b.year);
    
    return NextResponse.json({
      latestYear,
      latestYearData,
      trendData,
      allYears: Array.from(new Set(filtered.map(d => d.year))).sort(),
    });
  } catch (error) {
    console.error("Error fetching aggregated OPEX:", error);
    return NextResponse.json(
      { error: "Failed to fetch aggregated OPEX" },
      { status: 500 }
    );
  }
}

