import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateMockEJFData } from "@/lib/mock-data/generators";

/**
 * Sync EJF (Property Valuation and Income Tax Administration) data
 * 
 * Note: This is a placeholder implementation. You'll need to:
 * 1. Get API credentials from SKAT
 * 2. Implement actual API calls
 * 3. Handle rate limiting
 */
export async function POST(req: NextRequest) {
  try {
    const { address, zipCode, year } = await req.json();

    if (!address || !zipCode) {
      return NextResponse.json(
        { error: "Address and zip code required" },
        { status: 400 }
      );
    }

    const taxYear = year || new Date().getFullYear();

    // Generate realistic mock data based on address
    // TODO: Replace with actual EJF API call
    const mockEJFData = generateMockEJFData(address, zipCode, taxYear);

    // Try to match with existing asset
    const asset = await prisma.asset.findFirst({
      where: {
        OR: [
          { address: { contains: address, mode: "insensitive" } },
          { name: { contains: address, mode: "insensitive" } },
        ],
      },
    });

    // Upsert EJF data (unique on address, zipCode, year)
    const ejfRecord = await prisma.eJFData.upsert({
      where: {
        ejf_address_zip_year: {
          address,
          zipCode,
          year: taxYear,
        },
      },
      update: {
        ...mockEJFData,
        propertyId: asset?.id,
        lastUpdated: new Date(),
      },
      create: {
        ...mockEJFData,
        propertyId: asset?.id,
        lastUpdated: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: ejfRecord,
      message: "EJF data synced successfully",
    });
  } catch (error) {
    console.error("EJF sync error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to sync EJF data",
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
    const year = searchParams.get("year");

    if (!address || !zipCode) {
      return NextResponse.json(
        { error: "Address and zip code required" },
        { status: 400 }
      );
    }

    const taxYear = year ? parseInt(year) : new Date().getFullYear();

    const ejfData = await prisma.eJFData.findFirst({
      where: {
        address: { contains: address, mode: "insensitive" },
        zipCode,
        year: taxYear,
      },
      include: {
        asset: true,
      },
    });

    if (!ejfData) {
      return NextResponse.json(
        { error: "EJF data not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: ejfData });
  } catch (error) {
    console.error("EJF fetch error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch EJF data",
      },
      { status: 500 }
    );
  }
}
