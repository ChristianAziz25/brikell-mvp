import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateMockOISData } from "@/lib/mock-data/generators";

/**
 * Sync OIS (Public Information Server) data
 * 
 * Note: This is a placeholder implementation. You'll need to:
 * 1. Get API credentials from OIS
 * 2. Implement actual API calls
 * 3. Handle rate limiting
 */
export async function POST(req: NextRequest) {
  try {
    const { address, zipCode } = await req.json();

    if (!address || !zipCode) {
      return NextResponse.json(
        { error: "Address and zip code required" },
        { status: 400 }
      );
    }

    // Generate realistic mock data based on address
    // TODO: Replace with actual OIS API call
    const mockOISData = generateMockOISData(address, zipCode);

    // Try to match with existing asset
    const asset = await prisma.asset.findFirst({
      where: {
        OR: [
          { address: { contains: address, mode: "insensitive" } },
          { name: { contains: address, mode: "insensitive" } },
        ],
      },
    });

    // Check if OIS data already exists
    const existing = await prisma.oISData.findFirst({
      where: {
        address: { contains: address, mode: "insensitive" },
        zipCode,
      },
    });

    const oisRecord = existing
      ? await prisma.oISData.update({
          where: { id: existing.id },
          data: {
            ...mockOISData,
            propertyId: asset?.id,
            lastUpdated: new Date(),
          },
        })
      : await prisma.oISData.create({
          data: {
            ...mockOISData,
            propertyId: asset?.id,
            lastUpdated: new Date(),
          },
        });

    return NextResponse.json({
      success: true,
      data: oisRecord,
      message: "OIS data synced successfully",
    });
  } catch (error) {
    console.error("OIS sync error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to sync OIS data",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const address = searchParams.get("address");
    const zipCode = searchParams.get("zipCode");

    if (!address || !zipCode) {
      return NextResponse.json(
        { error: "Address and zip code required" },
        { status: 400 }
      );
    }

    const oisData = await prisma.oISData.findFirst({
      where: {
        address: { contains: address, mode: "insensitive" },
        zipCode,
      },
      include: {
        asset: true,
      },
    });

    if (!oisData) {
      return NextResponse.json(
        { error: "OIS data not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: oisData });
  } catch (error) {
    console.error("OIS fetch error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch OIS data",
      },
      { status: 500 }
    );
  }
}
