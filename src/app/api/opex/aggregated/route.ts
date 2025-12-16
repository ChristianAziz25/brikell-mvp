/**
 * API Route: /api/opex/aggregated
 * 
 * Returns aggregated OPEX data by year and category
 * Optimized with efficient client-side aggregation
 */

import { getAllAssets } from "@/lib/prisma/models/asset";
import { NextRequest, NextResponse } from "next/server";

/**
 * Sum all actual_* fields from an OPEX row
 */
function sumOpexActual(opex: {
  actual_delinquency: number;
  actual_property_management_fee: number;
  actual_leasing_fee: number;
  actual_property_taxes: number;
  actual_refuse_collection: number;
  actual_insurance: number;
  actual_cleaning: number;
  actual_facility_management: number;
  actual_service_subscriptions: number;
  actual_common_consumption: number;
  actual_home_owner_association: number;
}): number {
  return (
    (opex.actual_delinquency ?? 0) +
    (opex.actual_property_management_fee ?? 0) +
    (opex.actual_leasing_fee ?? 0) +
    (opex.actual_property_taxes ?? 0) +
    (opex.actual_refuse_collection ?? 0) +
    (opex.actual_insurance ?? 0) +
    (opex.actual_cleaning ?? 0) +
    (opex.actual_facility_management ?? 0) +
    (opex.actual_service_subscriptions ?? 0) +
    (opex.actual_common_consumption ?? 0) +
    (opex.actual_home_owner_association ?? 0)
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const building = searchParams.get("building");

  try {
    const assets = await getAllAssets();
    
    // Build aggregated data: assetName -> year -> totalActual
    const opexByAssetAndYear = new Map<string, Map<number, number>>();
    const allYearsSet = new Set<number>();
    
    // Filter by building if specified
    const filteredAssets = building && building !== "All Buildings"
      ? assets.filter(asset => asset.name === building)
      : assets;
    
    // Aggregate OPEX data
    for (const asset of filteredAssets) {
      if (!asset.opex || asset.opex.length === 0) continue;
      
      const assetMap = opexByAssetAndYear.get(asset.name) ?? new Map<number, number>();
      
      for (const opex of asset.opex) {
        const totalActual = sumOpexActual(opex);
        const year = opex.opex_year;
        
        allYearsSet.add(year);
        assetMap.set(year, (assetMap.get(year) ?? 0) + totalActual);
      }
      
      opexByAssetAndYear.set(asset.name, assetMap);
    }
    
    // Convert to array format
    const opexData: Array<{ assetName: string; year: number; totalActual: number }> = [];
    for (const [assetName, yearMap] of opexByAssetAndYear.entries()) {
      for (const [year, totalActual] of yearMap.entries()) {
        opexData.push({ assetName, year, totalActual });
      }
    }
    
    // Get latest year
    const allYears = Array.from(allYearsSet).sort((a, b) => b - a);
    const latestYear = allYears.length > 0 ? allYears[0] : null;
    
    // Get latest year data
    const latestYearData = latestYear
      ? opexData.filter(d => d.year === latestYear)
      : [];
    
    // Aggregate by year for trend
    const yearTotals = new Map<number, number>();
    for (const d of opexData) {
      yearTotals.set(d.year, (yearTotals.get(d.year) ?? 0) + d.totalActual);
    }
    
    const trendData = Array.from(yearTotals.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((a, b) => a.year - b.year);
    
    return NextResponse.json({
      latestYear,
      latestYearData,
      trendData,
      allYears: allYears.reverse(), // Return in ascending order
    });
  } catch (error) {
    console.error("Error fetching aggregated OPEX:", error);
    return NextResponse.json(
      { error: "Failed to fetch aggregated OPEX" },
      { status: 500 }
    );
  }
}

