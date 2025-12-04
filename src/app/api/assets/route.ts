import { getAllAssetsCapexOpexTri } from "@/lib/prisma/models/asset";
import { NextResponse } from "next/server";
import { getTableData } from "./getTriTableData";

export async function GET() {
  try {
    const assets = await getAllAssetsCapexOpexTri();
    const tableData = await Promise.all(assets.map(async (asset) => {
      return await getTableData(asset);
    }));
    return NextResponse.json(tableData);
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}


