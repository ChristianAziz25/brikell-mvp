/**
 * API Route: /api/assets/yearly-metrics
 * 
 * Returns yearly metrics by asset in YearByAssetRow format for multi-series charts
 * Optimized with efficient client-side aggregation
 */

import { getAllAssets } from "@/lib/prisma/models/asset";
import { buildYearByAssetForMetric, type YearByAssetRow } from "@/lib/timeSeriesData";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const metric = searchParams.get("metric");

  if (!metric) {
    return NextResponse.json(
      { error: "Metric parameter is required. Use: capex, opex, gri, or occupancy" },
      { status: 400 }
    );
  }

  const validMetrics = ["capex", "opex", "gri", "occupancy"];
  if (!validMetrics.includes(metric)) {
    return NextResponse.json(
      { error: `Invalid metric. Must be one of: ${validMetrics.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const assets = await getAllAssets();
    const data = buildYearByAssetForMetric(
      assets,
      metric as "capex" | "opex" | "gri" | "occupancy"
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching yearly metrics by asset:", error);
    return NextResponse.json(
      { error: "Failed to fetch yearly metrics by asset" },
      { status: 500 }
    );
  }
}

