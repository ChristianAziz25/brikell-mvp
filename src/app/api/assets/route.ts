import { getAllAssetsNames } from "@/lib/prisma/models/asset";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const assets = await getAllAssetsNames();
    return NextResponse.json(assets.map((asset) => asset.name));
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}


