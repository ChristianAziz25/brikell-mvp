/**
 * API Route: /api/asset/yearly-metrics
 * 
 * Returns yearly aggregated metrics for a single asset
 * Optimized with efficient client-side aggregation
 */

import { getAllAssets } from "@/lib/prisma/models/asset";
import { buildAssetTimeSeries } from "@/lib/timeSeriesData";
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
    const assets = await getAllAssets();
    const timeSeries = buildAssetTimeSeries(assets);
    
    // Find the asset by name
    const assetSeries = timeSeries.find((s) => s.assetName === assetName);
    
    if (!assetSeries) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }
    
    // Build year-based map to combine all metrics
    const yearMap = new Map<number, {
      year: number;
      capex: number;
      opex: number;
      tri: number;
      occupancy: number;
    }>();
    
    // Add CAPEX data
    assetSeries.capex.forEach((capex) => {
      if (!yearMap.has(capex.year)) {
        yearMap.set(capex.year, {
          year: capex.year,
          capex: 0,
          opex: 0,
          tri: 0,
          occupancy: 0,
        });
      }
      const entry = yearMap.get(capex.year)!;
      entry.capex = capex.totalCapexActual;
    });
    
    // Add OPEX data
    assetSeries.opex.forEach((opex) => {
      if (!yearMap.has(opex.year)) {
        yearMap.set(opex.year, {
          year: opex.year,
          capex: 0,
          opex: 0,
          tri: 0,
          occupancy: 0,
        });
      }
      const entry = yearMap.get(opex.year)!;
      entry.opex = opex.totalOpexActual;
    });
    
    // Add GRI (TRI) data
    assetSeries.gri.forEach((gri) => {
      if (!yearMap.has(gri.year)) {
        yearMap.set(gri.year, {
          year: gri.year,
          capex: 0,
          opex: 0,
          tri: 0,
          occupancy: 0,
        });
      }
      const entry = yearMap.get(gri.year)!;
      entry.tri = gri.gri;
    });
    
    // Add occupancy data
    assetSeries.occupancy.forEach((occupancy) => {
      if (!yearMap.has(occupancy.year)) {
        yearMap.set(occupancy.year, {
          year: occupancy.year,
          capex: 0,
          opex: 0,
          tri: 0,
          occupancy: 0,
        });
      }
      const entry = yearMap.get(occupancy.year)!;
      entry.occupancy = occupancy.occupancyRate;
    });
    
    // Convert to array and sort by year
    const yearBasedData = Array.from(yearMap.values())
      .sort((a, b) => a.year - b.year);
    
    return NextResponse.json(yearBasedData);
  } catch (error) {
    console.error("Error fetching asset yearly metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset yearly metrics" },
      { status: 500 }
    );
  }
}

