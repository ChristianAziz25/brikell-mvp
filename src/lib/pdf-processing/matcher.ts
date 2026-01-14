import { prisma } from "@/lib/prisma/client";
import { normalizeAddress, stringSimilarity } from "./normalizer";
import type { MatchResult, MatchingStats, MatchingResult } from "./types";
import type { PdfParsedUnits, RentRollUnit } from "@/generated/client";

// Matching weights
const WEIGHTS = {
  address: 0.4,
  floorDoor: 0.3,
  size: 0.3,
};

// Minimum confidence threshold for a match
const MIN_CONFIDENCE = 0.7;

// Size tolerance (percentage)
const SIZE_TOLERANCE = 0.1; // 10%

interface MatchCandidate {
  dbUnit: RentRollUnit;
  score: number;
  method: "exact" | "fuzzy" | "composite";
  details: {
    addressScore: number;
    floorDoorScore: number;
    sizeScore: number;
  };
}

/**
 * Match parsed PDF units against the units table in Supabase
 */
export async function matchAgainstUnitsTable(
  jobId: string,
  assetId?: string | null
): Promise<MatchingResult> {
  // 1. Get parsed units from PDF
  const pdfUnits = await prisma.pdfParsedUnits.findMany({
    where: { jobId },
  });

  if (pdfUnits.length === 0) {
    return {
      stats: {
        totalPdfUnits: 0,
        totalDbUnits: 0,
        matched: 0,
        missing: 0,
        extra: 0,
        avgConfidence: 0,
      },
      processedAt: new Date().toISOString(),
    };
  }

  // 2. Get DB units (scoped to asset if provided)
  const dbUnits = await prisma.rentRollUnit.findMany({
    where: assetId ? { assetId } : {},
  });

  // Track which DB units have been matched
  const matchedDbIds = new Set<number>();
  let totalConfidence = 0;
  let matchedCount = 0;
  let missingCount = 0;

  // 3. Match each PDF unit
  for (const pdfUnit of pdfUnits) {
    const match = findBestMatch(pdfUnit, dbUnits, matchedDbIds);

    if (match) {
      // Update PDF unit with match result
      await prisma.pdfParsedUnits.update({
        where: { id: pdfUnit.id },
        data: {
          matchStatus: "matched",
          matchedUnitId: match.unitId,
          matchConfidence: match.confidence,
          matchMethod: match.method,
        },
      });

      matchedDbIds.add(match.unitId);
      totalConfidence += match.confidence;
      matchedCount++;
    } else {
      // Mark as missing (in PDF but not in DB)
      await prisma.pdfParsedUnits.update({
        where: { id: pdfUnit.id },
        data: {
          matchStatus: "missing",
          matchedUnitId: null,
          matchConfidence: null,
          matchMethod: null,
        },
      });
      missingCount++;
    }
  }

  // 4. Calculate stats
  const extraCount = dbUnits.filter((u) => !matchedDbIds.has(u.unit_id)).length;

  const stats: MatchingStats = {
    totalPdfUnits: pdfUnits.length,
    totalDbUnits: dbUnits.length,
    matched: matchedCount,
    missing: missingCount,
    extra: extraCount,
    avgConfidence: matchedCount > 0 ? totalConfidence / matchedCount : 0,
  };

  return {
    stats,
    processedAt: new Date().toISOString(),
  };
}

/**
 * Find the best matching DB unit for a PDF unit
 */
function findBestMatch(
  pdfUnit: PdfParsedUnits,
  dbUnits: RentRollUnit[],
  alreadyMatched: Set<number>
): MatchResult | null {
  // Pre-filter by zipcode if available
  let candidates = dbUnits;
  if (pdfUnit.unitZipcode) {
    const sameZip = dbUnits.filter(
      (u) => u.unit_zipcode === pdfUnit.unitZipcode && !alreadyMatched.has(u.unit_id)
    );
    if (sameZip.length > 0) {
      candidates = sameZip;
    }
  }

  // Filter out already matched units
  candidates = candidates.filter((u) => !alreadyMatched.has(u.unit_id));

  if (candidates.length === 0) {
    return null;
  }

  // Score each candidate
  const scored: MatchCandidate[] = candidates.map((dbUnit) =>
    calculateMatchScore(pdfUnit, dbUnit)
  );

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  const bestMatch = scored[0];

  // Return match if above threshold
  if (bestMatch && bestMatch.score >= MIN_CONFIDENCE) {
    return {
      unitId: bestMatch.dbUnit.unit_id,
      confidence: bestMatch.score,
      method: bestMatch.method,
    };
  }

  return null;
}

/**
 * Calculate match score between a PDF unit and a DB unit
 */
function calculateMatchScore(
  pdfUnit: PdfParsedUnits,
  dbUnit: RentRollUnit
): MatchCandidate {
  const scores = {
    address: 0,
    floorDoor: 0,
    size: 0,
  };

  // 1. Address matching (40% weight)
  if (pdfUnit.unitAddress && dbUnit.unit_address) {
    const pdfNorm = normalizeAddress(pdfUnit.unitAddress);
    const dbNorm = normalizeAddress(dbUnit.unit_address);

    if (pdfNorm.normalized === dbNorm.normalized) {
      scores.address = 1.0;
    } else {
      // Fuzzy match on normalized addresses
      scores.address = stringSimilarity(pdfNorm.normalized, dbNorm.normalized);
    }
  }

  // 2. Floor + Door matching (30% weight)
  const floorMatch = pdfUnit.unitFloor !== null && pdfUnit.unitFloor === dbUnit.unit_floor;
  const doorMatch = pdfUnit.unitDoor !== null && pdfUnit.unitDoor === dbUnit.unit_door;

  if (floorMatch && doorMatch) {
    scores.floorDoor = 1.0;
  } else if (floorMatch || doorMatch) {
    scores.floorDoor = 0.5;
  }

  // 3. Size matching (30% weight) - within tolerance
  if (pdfUnit.sizeSqm !== null && dbUnit.size_sqm !== null) {
    const pdfSize = Number(pdfUnit.sizeSqm);
    const dbSize = dbUnit.size_sqm;
    const sizeDiff = Math.abs(pdfSize - dbSize) / Math.max(pdfSize, dbSize, 1);

    if (sizeDiff <= SIZE_TOLERANCE * 0.5) {
      scores.size = 1.0; // Within 5%
    } else if (sizeDiff <= SIZE_TOLERANCE) {
      scores.size = 0.8; // Within 10%
    } else if (sizeDiff <= SIZE_TOLERANCE * 2) {
      scores.size = 0.5; // Within 20%
    } else {
      scores.size = 0;
    }
  }

  // Weighted composite score
  const compositeScore =
    scores.address * WEIGHTS.address +
    scores.floorDoor * WEIGHTS.floorDoor +
    scores.size * WEIGHTS.size;

  // Determine match method
  let method: "exact" | "fuzzy" | "composite" = "composite";
  if (scores.address === 1.0 && scores.floorDoor === 1.0) {
    method = "exact";
  } else if (scores.address < 1.0 && scores.address > 0.8) {
    method = "fuzzy";
  }

  return {
    dbUnit,
    score: compositeScore,
    method,
    details: {
      addressScore: scores.address,
      floorDoorScore: scores.floorDoor,
      sizeScore: scores.size,
    },
  };
}

/**
 * Get units in DB that weren't matched to any PDF unit
 */
export async function getUnmatchedDbUnits(
  jobId: string,
  assetId?: string | null
): Promise<RentRollUnit[]> {
  if (!assetId) return [];

  const matchedUnits = await prisma.pdfParsedUnits.findMany({
    where: {
      jobId,
      matchedUnitId: { not: null },
    },
    select: { matchedUnitId: true },
  });

  const matchedIds = matchedUnits
    .map((u) => u.matchedUnitId)
    .filter((id): id is number => id !== null);

  return prisma.rentRollUnit.findMany({
    where: {
      assetId,
      unit_id: {
        notIn: matchedIds.length > 0 ? matchedIds : [-1],
      },
    },
  });
}
