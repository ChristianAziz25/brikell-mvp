import { getAllAssets } from "@/lib/prisma/models/asset";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const assets = await getAllAssets();
    return NextResponse.json(assets);
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}


