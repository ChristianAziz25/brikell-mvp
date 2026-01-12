import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ buildings: [], units: [] });
  }

  const searchTerm = query.trim().toLowerCase();

  try {
    // Search for buildings (assets)
    const buildings = await prisma.asset.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { address: { contains: searchTerm, mode: "insensitive" } },
          { city: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        country: true,
      },
      take: 10,
    });

    // Search for units (rent roll units)
    const units = await prisma.rentRollUnit.findMany({
      where: {
        OR: [
          { unit_address: { contains: searchTerm, mode: "insensitive" } },
          { property_name: { contains: searchTerm, mode: "insensitive" } },
          { tenant_name1: { contains: searchTerm, mode: "insensitive" } },
          { tenant_name2: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        unit_id: true,
        unit_address: true,
        property_name: true,
        unit_type: true,
        tenant_name1: true,
        tenant_name2: true,
        units_status: true,
        assetId: true,
      },
      take: 10,
    });

    return NextResponse.json({
      buildings: buildings.map((b) => ({
        id: b.id,
        name: b.name,
        address: b.address,
        city: b.city,
        country: b.country,
        type: "building",
      })),
      units: units.map((u) => ({
        id: u.unit_id,
        address: u.unit_address,
        propertyName: u.property_name,
        unitType: u.unit_type,
        tenantName1: u.tenant_name1,
        tenantName2: u.tenant_name2,
        status: u.units_status,
        assetId: u.assetId,
        type: "unit",
      })),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
