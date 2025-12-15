import { getAllAssets } from "@/lib/prisma/models/asset";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get("assetId");
    const year = searchParams.get("year");

    const assets = await getAllAssets();

    // If assetId is provided, filter by it
    const filteredAssets = assetId
      ? assets.filter((asset) => asset.id === assetId)
      : assets;

    // Fetch OPEX data for filtered assets
    const opexData = filteredAssets.flatMap((asset) =>
      asset.opex.map((opex) => ({
        ...opex,
        assetName: asset.name,
      }))
    );

    // If year is provided, filter by it
    const filteredByYear = year
      ? opexData.filter((opex) => opex.opex_year === parseInt(year))
      : opexData;

    // Sort by year and asset name
    filteredByYear.sort((a, b) => {
      if (a.opex_year !== b.opex_year) {
        return a.opex_year - b.opex_year;
      }
      return a.assetName.localeCompare(b.assetName);
    });

    return NextResponse.json(filteredByYear);
  } catch (error) {
    console.error("Error fetching OPEX data:", error);
    return NextResponse.json(
      { error: "Failed to fetch OPEX data" },
      { status: 500 }
    );
  }
}
