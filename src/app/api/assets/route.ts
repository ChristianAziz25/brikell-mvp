import { getAllAssets } from "@/lib/prisma/models/asset";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Correctly parse query parameters from the full URL
  const { searchParams } = new URL(request.url);
  const isDetailed = searchParams.get("detailed") === "true";

  try {
    const assets = await getAllAssets();

    // When detailed=true, return full asset objects with all included relations
    if (isDetailed) {
      return NextResponse.json(assets);
    }

    // Otherwise, just return a lightweight list of ids and names
    const assetsNames = assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
    }));

    return NextResponse.json(assetsNames);
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}

