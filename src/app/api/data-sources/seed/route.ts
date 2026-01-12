import { seedMockDataForAssets } from "@/lib/mock-data/generators";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const results = await seedMockDataForAssets();
    
    return NextResponse.json({
      success: true,
      message: `Seeded mock data for ${results.length} assets`,
      results,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to seed mock data",
      },
      { status: 500 }
    );
  }
}
