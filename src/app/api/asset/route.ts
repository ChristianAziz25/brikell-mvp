import { getAllAssetsCapexOpexTri } from "@/lib/prisma/models/asset";
import { NextRequest, NextResponse } from "next/server";
import { getTableData } from "../assets/getTriTableData";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    const assets = await getAllAssetsCapexOpexTri();

    if (!assets.length) {
      return NextResponse.json(
        { error: "No assets found" },
        { status: 404 }
      );
    }

    const asset =
      (name && assets.find((a) => a.name === name)) ?? assets[0];

    console.log(asset);
    if (!asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }

    const tableData = await getTableData(asset);
    return NextResponse.json(tableData);
  } catch (error) {
    console.error("Error fetching asset:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset" },
      { status: 500 }
    );
  }
}


