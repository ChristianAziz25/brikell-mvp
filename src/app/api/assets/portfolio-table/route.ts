/**
 * API Route: /api/assets/portfolio-table
 * 
 * Returns portfolio table data with current year metrics per asset
 * Optimized using TimescaleDB continuous aggregates
 */

import { getAllYearlyMetricsByAsset } from "@/lib/timescaledb-queries";
import prisma from "@/lib/prisma/client";
import { NextResponse } from "next/server";

const CURRENT_YEAR = new Date().getFullYear();

export async function GET() {
  try {
    // Get yearly metrics
    const metrics = await getAllYearlyMetricsByAsset();
    const currentYearMetrics = metrics.filter(m => m.year === CURRENT_YEAR);
    
    // Get unit counts per asset
    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        name: true,
        rentRoll: {
          select: {
            unit_id: true,
          },
        },
      },
    });
    
    const unitsByAssetId = new Map(
      assets.map(a => [a.id, a.rentRoll.length])
    );
    
    // Build portfolio rows
    const portfolioRows = currentYearMetrics.map((metric) => {
      const gri = metric.gri ?? 0;
      const opex = metric.opexActual ?? 0;
      const occupancy = metric.occupancyRate ?? 0;
      const unitCount = unitsByAssetId.get(metric.assetId) ?? 0;
      
      const noi = gri - opex;
      const noiMargin = gri !== 0 ? (noi / gri) * 100 : 0;
      const vacancy = (1 - occupancy) * 100;
      const opexPerUnit = unitCount > 0 ? opex / unitCount : 0;
      
      return {
        property: metric.assetName,
        vacancy,
        opex,
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

