/**
 * Fast in-memory unit matching against RentRollUnit table
 * No database writes - purely read-only matching
 */

import { prisma } from "@/lib/prisma/client";
import { normalizeAddress, stringSimilarity } from "./normalizer";
import type { ExtractedUnit, UnitMatchResult } from "./types";
import type { RentRollUnit } from "@/generated/client";

// Matching configuration
const WEIGHTS = {
  address: 0.4,
  floorDoor: 0.3,
  size: 0.3,
};
const MIN_CONFIDENCE = 0.7;
const SIZE_TOLERANCE = 0.1; // 10%

interface MatchScore {
  dbUnit: RentRollUnit;
  score: number;
}

/**
 * Match PDF-extracted units against RentRollUnit table in-memory
 * Returns units that could NOT be matched (anomalies)
 */
export async function matchUnitsInMemory(
  extractedUnits: ExtractedUnit[],
  assetId?: string
): Promise<UnitMatchResult> {
  if (extractedUnits.length === 0) {
    return {
      unmatchedUnits: [],
      matchedCount: 0,
      totalExtracted: 0,
      hasAnomalies: false,
    };
  }

  // Fetch DB units (scoped to asset if provided)
  const dbUnits = await prisma.rentRollUnit.findMany({
    where: assetId ? { assetId } : {},
  });

  const matchedDbIds = new Set<number>();
  const unmatchedUnits: ExtractedUnit[] = [];
  let matchedCount = 0;

  for (const pdfUnit of extractedUnits) {
    const match = findBestMatch(pdfUnit, dbUnits, matchedDbIds);

    if (match) {
      matchedDbIds.add(match.dbUnit.unit_id);
      matchedCount++;
    } else {
      unmatchedUnits.push(pdfUnit);
    }
  }

  return {
    unmatchedUnits,
    matchedCount,
    totalExtracted: extractedUnits.length,
    hasAnomalies: unmatchedUnits.length > 0,
  };
}

/**
 * Find the best matching DB unit for an extracted unit
 */
function findBestMatch(
  pdfUnit: ExtractedUnit,
  dbUnits: RentRollUnit[],
  alreadyMatched: Set<number>
): MatchScore | null {
  // Pre-filter by zipcode if available
  let candidates = dbUnits.filter((u) => !alreadyMatched.has(u.unit_id));

  if (pdfUnit.unit_zipcode) {
    const sameZip = candidates.filter(
      (u) => u.unit_zipcode === pdfUnit.unit_zipcode
    );
    if (sameZip.length > 0) {
      candidates = sameZip;
    }
  }

  if (candidates.length === 0) return null;

  // Score each candidate
  const scored = candidates.map((dbUnit) => ({
    dbUnit,
    score: calculateScore(pdfUnit, dbUnit),
  }));

  // Find best match above threshold
  const best = scored.reduce((a, b) => (a.score > b.score ? a : b));

  return best.score >= MIN_CONFIDENCE ? best : null;
}

/**
 * Calculate match score between a PDF unit and a DB unit
 */
function calculateScore(pdfUnit: ExtractedUnit, dbUnit: RentRollUnit): number {
  let addressScore = 0;
  let floorDoorScore = 0;
  let sizeScore = 0;

  // Address matching (40%)
  if (pdfUnit.unit_address && dbUnit.unit_address) {
    const pdfNorm = normalizeAddress(pdfUnit.unit_address);
    const dbNorm = normalizeAddress(dbUnit.unit_address);
    addressScore =
      pdfNorm.normalized === dbNorm.normalized
        ? 1.0
        : stringSimilarity(pdfNorm.normalized, dbNorm.normalized);
  }

  // Floor + Door matching (30%)
  const floorMatch =
    pdfUnit.unit_floor !== undefined && pdfUnit.unit_floor === dbUnit.unit_floor;
  const doorMatch =
    pdfUnit.unit_door !== undefined && pdfUnit.unit_door === dbUnit.unit_door;

  if (floorMatch && doorMatch) {
    floorDoorScore = 1.0;
  } else if (floorMatch || doorMatch) {
    floorDoorScore = 0.5;
  }

  // Size matching (30%)
  if (pdfUnit.size_sqm && dbUnit.size_sqm) {
    const sizeDiff =
      Math.abs(pdfUnit.size_sqm - dbUnit.size_sqm) /
      Math.max(pdfUnit.size_sqm, dbUnit.size_sqm, 1);
    if (sizeDiff <= SIZE_TOLERANCE * 0.5) {
      sizeScore = 1.0; // Within 5%
    } else if (sizeDiff <= SIZE_TOLERANCE) {
      sizeScore = 0.8; // Within 10%
    } else if (sizeDiff <= SIZE_TOLERANCE * 2) {
      sizeScore = 0.5; // Within 20%
    }
  }

  return (
    addressScore * WEIGHTS.address +
    floorDoorScore * WEIGHTS.floorDoor +
    sizeScore * WEIGHTS.size
  );
}
