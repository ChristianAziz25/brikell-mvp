/**
 * API Route: /api/assets/portfolio-table
 * 
 * Returns portfolio table data with current year metrics per asset
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
    
    const unitsByAssetId = new Map<string, number>();
    assets.forEach((asset) => {
      unitsByAssetId.set(asset.id, asset.rentRoll.length);
    });
    
    const portfolioRows = timeSeries.map((series) => {
      const currentOpex =
        series.opex.find((o) => o.year === CURRENT_YEAR)?.totalOpexActual ?? 0;
      const currentGri =
        series.gri.find((g) => g.year === CURRENT_YEAR)?.gri ?? 0;
      const currentOccupancy =
        series.occupancy.find((o) => o.year === CURRENT_YEAR)?.occupancyRate ?? 0;
      const unitCount = unitsByAssetId.get(series.assetId) ?? 0;

      const noi = currentGri - currentOpex;
      const noiMargin = currentGri !== 0 ? (noi / currentGri) * 100 : 0;
      const vacancy = (1 - currentOccupancy) * 100;
      const opexPerUnit = unitCount > 0 ? currentOpex / unitCount : 0;

      return {
        property: series.assetName,
        vacancy,
        opex: currentOpex,
        opexPerUnit,
        noi,
        noiMargin,
      };
    });
    
    return NextResponse.json(portfolioRows);
  } catch (error) {
    console.error("Error fetching portfolio table:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio table" },
      { status: 500 }
    );
  }
}

