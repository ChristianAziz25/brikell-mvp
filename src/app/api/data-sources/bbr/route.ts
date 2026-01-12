import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateMockBBRData } from "@/lib/mock-data/generators";

/**
 * Sync BBR (Building and Housing Register) data
 * 
 * Note: This is a placeholder implementation. You'll need to:
 * 1. Get API credentials from https://datafordeler.dk/
 * 2. Implement actual API calls to fetch BBR data
 * 3. Handle rate limiting and pagination
 */
export async function POST(req: NextRequest) {
  try {
    const { address, zipCode, bbrNumber } = await req.json();

    if (!address && !bbrNumber) {
      return NextResponse.json(
        { error: "Address or BBR number required" },
        { status: 400 }
      );
    }

    // TODO: Replace with actual BBR API call
    // Example structure:
    // const response = await fetch(
    //   `https://api.datafordeler.dk/bbr/v1/bygninger?adresse=${address}&postnr=${zipCode}`,
    //   {
    //     headers: {
    //       Authorization: `Bearer ${process.env.BBR_API_KEY}`,
    //     },
    //   }
    // );
    // const bbrData = await response.json();

    // Generate realistic mock data based on address
    // In production, you would:
    // 1. Fetch from BBR API
    // 2. Parse the response
    // 3. Upsert into database

    const mockBBRData = generateMockBBRData(
      address || "Unknown Address",
      zipCode || "1000"
    );
    
    // Override BBR number if provided
    if (bbrNumber) {
      mockBBRData.bbrNumber = bbrNumber;
    }

    // Try to match with existing asset
    const asset = await prisma.asset.findFirst({
      where: {
        OR: [
          { address: { contains: address || "", mode: "insensitive" } },
          { name: { contains: address || "", mode: "insensitive" } },
        ],
      },
    });

    // Upsert BBR data
    const bbrRecord = await prisma.bBRData.upsert({
      where: { bbrNumber: mockBBRData.bbrNumber },
      update: {
        ...mockBBRData,
        propertyId: asset?.id,
        lastUpdated: new Date(),
      },
      create: {
        ...mockBBRData,
        propertyId: asset?.id,
        lastUpdated: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: bbrRecord,
      message: "BBR data synced successfully",
    });
  } catch (error) {
    console.error("BBR sync error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to sync BBR data",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to fetch BBR data for a property
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const address = searchParams.get("address");
    const zipCode = searchParams.get("zipCode");
    const bbrNumber = searchParams.get("bbrNumber");

    if (!address && !bbrNumber) {
      return NextResponse.json(
        { error: "Address or BBR number required" },
        { status: 400 }
      );
    }

    const bbrData = await prisma.bBRData.findFirst({
      where: {
        OR: [
          bbrNumber
            ? { bbrNumber }
            : {
                address: { contains: address || "", mode: "insensitive" },
                zipCode: zipCode || undefined,
              },
        ],
      },
      include: {
        asset: true,
      },
    });

    if (!bbrData) {
      return NextResponse.json(
        { error: "BBR data not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: bbrData });
  } catch (error) {
    console.error("BBR fetch error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch BBR data",
      },
      { status: 500 }
    );
  }
}
