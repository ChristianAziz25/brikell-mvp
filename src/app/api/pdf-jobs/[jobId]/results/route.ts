import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import type {
  JobResultsResponse,
  MatchedUnit,
  PdfUnitResult,
  DbUnitResult,
  MatchingStats,
} from "@/lib/pdf-processing/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    const job = await prisma.pdfJob.findUnique({
      where: { id: jobId },
      include: {
        parsedUnits: {
          include: {
            matchedUnit: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.status !== "completed") {
      return NextResponse.json(
        {
          error: "Results not ready",
          status: job.status,
          progress: job.progress,
        },
        { status: 400 }
      );
    }

    // Build matched units list
    const matchedUnits: MatchedUnit[] = job.parsedUnits
      .filter((u) => u.matchStatus === "matched" && u.matchedUnit)
      .map((u) => ({
        pdfUnit: {
          id: u.id,
          address: u.unitAddress,
          zipcode: u.unitZipcode,
          floor: u.unitFloor,
          door: u.unitDoor,
          sizeSqm: u.sizeSqm ? Number(u.sizeSqm) : null,
          rentCurrent: u.rentCurrent ? Number(u.rentCurrent) : null,
          tenantName: u.tenantName,
        },
        dbUnit: {
          unitId: u.matchedUnit!.unit_id,
          address: u.matchedUnit!.unit_address,
          zipcode: u.matchedUnit!.unit_zipcode,
          floor: u.matchedUnit!.unit_floor,
          door: u.matchedUnit!.unit_door,
          sizeSqm: u.matchedUnit!.size_sqm,
          propertyName: u.matchedUnit!.property_name,
        },
        confidence: u.matchConfidence ? Number(u.matchConfidence) : 0,
        method: u.matchMethod || "unknown",
      }));

    // Build missing in DB list (units in PDF but not matched to DB)
    const missingInDb: PdfUnitResult[] = job.parsedUnits
      .filter((u) => u.matchStatus === "missing")
      .map((u) => ({
        id: u.id,
        address: u.unitAddress,
        zipcode: u.unitZipcode,
        floor: u.unitFloor,
        door: u.unitDoor,
        sizeSqm: u.sizeSqm ? Number(u.sizeSqm) : null,
        rentCurrent: u.rentCurrent ? Number(u.rentCurrent) : null,
        tenantName: u.tenantName,
      }));

    // Get units in DB that weren't matched (extra in DB)
    const matchedDbIds = job.parsedUnits
      .filter((u) => u.matchedUnitId !== null)
      .map((u) => u.matchedUnitId!);

    let extraInDb: DbUnitResult[] = [];

    if (job.assetId) {
      const unmatchedDbUnits = await prisma.rentRollUnit.findMany({
        where: {
          assetId: job.assetId,
          unit_id: {
            notIn: matchedDbIds.length > 0 ? matchedDbIds : [-1], // -1 to avoid empty array issue
          },
        },
        select: {
          unit_id: true,
          unit_address: true,
          unit_zipcode: true,
          unit_floor: true,
          unit_door: true,
          size_sqm: true,
          property_name: true,
        },
      });

      extraInDb = unmatchedDbUnits.map((u) => ({
        unitId: u.unit_id,
        address: u.unit_address,
        zipcode: u.unit_zipcode,
        floor: u.unit_floor,
        door: u.unit_door,
        sizeSqm: u.size_sqm,
        propertyName: u.property_name,
      }));
    }

    // Calculate stats
    const stats: MatchingStats = {
      totalPdfUnits: job.parsedUnits.length,
      totalDbUnits: matchedDbIds.length + extraInDb.length,
      matched: matchedUnits.length,
      missing: missingInDb.length,
      extra: extraInDb.length,
      avgConfidence:
        matchedUnits.length > 0
          ? matchedUnits.reduce((sum, m) => sum + m.confidence, 0) /
            matchedUnits.length
          : 0,
    };

    // Get summary from job or generate fallback
    const summary = job.summary || generateFallbackSummary(stats);

    const response: JobResultsResponse = {
      jobId: job.id,
      fileName: job.fileName,
      completedAt: job.completedAt?.toISOString() || null,
      matchedUnits,
      missingInDb,
      extraInDb,
      stats,
      summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("PDF job results error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateFallbackSummary(stats: MatchingStats): string {
  const bullets: string[] = [];

  if (stats.matched > 0) {
    bullets.push(
      `${stats.matched} unit${stats.matched !== 1 ? "s" : ""} matched with your portfolio`
    );
  }
  if (stats.missing > 0) {
    bullets.push(
      `${stats.missing} unit${stats.missing !== 1 ? "s" : ""} from the document not found in portfolio`
    );
  }
  if (stats.extra > 0) {
    bullets.push(
      `${stats.extra} portfolio unit${stats.extra !== 1 ? "s" : ""} not referenced in document`
    );
  }
  if (stats.avgConfidence > 0) {
    const conf = Math.round(stats.avgConfidence * 100);
    bullets.push(`Average match confidence: ${conf}%`);
    if (conf < 85) {
      bullets.push("Some matches have lower confidence - review recommended");
    }
  }

  return bullets.join("\n") || "Analysis complete.";
}
