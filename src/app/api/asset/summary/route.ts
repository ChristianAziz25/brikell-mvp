import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sumFields } from "@/lib/timeSeriesData";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assetName = searchParams.get("name");

  if (!assetName) {
    return NextResponse.json(
      { error: "Asset name parameter is required." },
      { status: 400 }
    );
  }

  try {
    const asset = await prisma.asset.findFirst({
      where: { name: assetName },
      include: {
        rentRoll: true,
        tri: true,
        opex: true,
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Units amount
    const unitsAmount = asset.rentRoll.length;

    // Built year (earliest lease_start year from rentRoll)
    const builtYears = asset.rentRoll
      .map((unit) => {
        if (unit.lease_start) {
          const d = new Date(unit.lease_start);
          return Number.isNaN(d.getTime()) ? null : d.getFullYear();
        }
        return null;
      })
      .filter(Boolean) as number[];
    const builtYear = builtYears.length > 0 ? Math.min(...builtYears) : null;

    // Latest data year
    const allYears = [
      ...asset.tri.map((t) => t.triYear),
      ...asset.opex.map((o) => o.opex_year),
    ];
    const latestDataYear = allYears.length > 0 ? Math.max(...allYears) : null;

    let gri = 0;
    let totalOpex = 0;
    let noiMargin = 0;
    let opexPerUnit = 0;

    if (latestDataYear) {
      const latestTri = asset.tri.find((t) => t.triYear === latestDataYear);
      const latestOpex = asset.opex.find((o) => o.opex_year === latestDataYear);

      if (latestTri) {
        gri = latestTri.triAmount - latestTri.vacancyLoss;
      }

      if (latestOpex) {
        totalOpex = sumFields(latestOpex, (k) => k.includes("actual"));
      }

      const noi = gri - totalOpex;
      if (gri !== 0) {
        noiMargin = (noi / gri) * 100;
      }

      if (unitsAmount > 0) {
        opexPerUnit = totalOpex / unitsAmount;
      }
    }

    return NextResponse.json({
      name: asset.name,
      address: asset.address,
      city: asset.city,
      country: asset.country,
      unitsAmount,
      builtYear,
      gri,
      opex: totalOpex,
      noiMargin,
      opexPerUnit,
      latestDataYear,
    });
  } catch (error) {
    console.error("Error fetching asset summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset summary" },
      { status: 500 }
    );
  }
}
