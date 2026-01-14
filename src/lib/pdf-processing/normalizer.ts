/**
 * Address normalization utilities for Danish addresses
 * Handles common variations in street names, floor patterns, and door identifiers
 */

export interface AddressComponents {
  streetName: string;
  streetNumber: string;
  floor?: string;
  door?: string;
  zipCode: string;
  city?: string;
}

export interface NormalizationResult {
  normalized: string;
  components: AddressComponents;
  confidence: number;
}

// Danish street type mappings (lowercase)
const STREET_TYPES: Record<string, string> = {
  vej: "vej",
  gade: "gade",
  alle: "alle",
  allé: "alle",
  plads: "plads",
  boulevard: "boulevard",
  stræde: "stræde",
  torv: "torv",
  park: "park",
};

// Floor mappings
const FLOOR_MAPPINGS: Record<string, string> = {
  st: "0",
  stuen: "0",
  stueetage: "0",
  kl: "-1",
  kælder: "-1",
  "1. sal": "1",
  "2. sal": "2",
  "3. sal": "3",
  "4. sal": "4",
  "5. sal": "5",
};

// Door position mappings
const DOOR_MAPPINGS: Record<string, string> = {
  tv: "left",
  th: "right",
  mf: "middle",
  v: "left",
  h: "right",
  m: "middle",
};

/**
 * Normalize a Danish address string
 */
export function normalizeAddress(raw: string): NormalizationResult {
  if (!raw || typeof raw !== "string") {
    return {
      normalized: "",
      components: { streetName: "", streetNumber: "", zipCode: "" },
      confidence: 0,
    };
  }

  // Clean and lowercase
  let normalized = raw.toLowerCase().trim();

  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, " ");

  // Standardize street type suffixes
  for (const [pattern, replacement] of Object.entries(STREET_TYPES)) {
    const regex = new RegExp(`\\b${pattern}\\b`, "gi");
    normalized = normalized.replace(regex, replacement);
  }

  // Extract components
  const components = parseAddressComponents(normalized);

  // Build canonical form
  const canonicalParts = [
    `${components.streetName} ${components.streetNumber}`.trim(),
    components.floor ? `fl${components.floor}` : null,
    components.door ? `d${components.door}` : null,
    components.zipCode,
  ].filter(Boolean);

  return {
    normalized: canonicalParts.join(", "),
    components,
    confidence: calculateConfidence(components),
  };
}

/**
 * Parse address string into components
 */
function parseAddressComponents(address: string): AddressComponents {
  // Pattern: "Vesterbrogade 123, 4. th, 1620 København"
  const fullPattern =
    /^(.+?)\s+(\d+\w?)[,\s]+(\d+\.?\s*(?:sal|tv|th|mf)?)?[,\s]*(\w+)?[,\s]*(\d{4})\s*(.+)?$/i;

  // Pattern: "Vesterbrogade 123, 1620"
  const simplePattern = /^(.+?)\s+(\d+\w?)[,\s]+(\d{4})\s*(.+)?$/i;

  // Pattern: "Vesterbrogade 123"
  const minimalPattern = /^(.+?)\s+(\d+\w?)$/i;

  let match = address.match(fullPattern);
  if (match) {
    return {
      streetName: match[1].trim(),
      streetNumber: match[2].trim(),
      floor: normalizeFloor(match[3]),
      door: normalizeDoor(match[4]),
      zipCode: match[5],
      city: match[6]?.trim(),
    };
  }

  match = address.match(simplePattern);
  if (match) {
    return {
      streetName: match[1].trim(),
      streetNumber: match[2].trim(),
      zipCode: match[3],
      city: match[4]?.trim(),
    };
  }

  match = address.match(minimalPattern);
  if (match) {
    return {
      streetName: match[1].trim(),
      streetNumber: match[2].trim(),
      zipCode: "",
    };
  }

  // Fallback: return raw as street name
  return {
    streetName: address,
    streetNumber: "",
    zipCode: "",
  };
}

/**
 * Normalize floor string to number
 */
function normalizeFloor(floor?: string): string | undefined {
  if (!floor) return undefined;

  const normalized = floor.toLowerCase().trim();

  // Check direct mappings
  if (FLOOR_MAPPINGS[normalized]) {
    return FLOOR_MAPPINGS[normalized];
  }

  // Extract number: "4. sal" -> "4"
  const numMatch = normalized.match(/(\d+)/);
  return numMatch ? numMatch[1] : undefined;
}

/**
 * Normalize door string
 */
function normalizeDoor(door?: string): string | undefined {
  if (!door) return undefined;

  const normalized = door.toLowerCase().trim();

  // Check direct mappings
  if (DOOR_MAPPINGS[normalized]) {
    return DOOR_MAPPINGS[normalized];
  }

  return normalized;
}

/**
 * Calculate confidence score for parsed components
 */
function calculateConfidence(components: AddressComponents): number {
  let score = 0;
  let maxScore = 0;

  // Street name (required, 30%)
  maxScore += 30;
  if (components.streetName && components.streetName.length > 2) {
    score += 30;
  }

  // Street number (required, 25%)
  maxScore += 25;
  if (components.streetNumber) {
    score += 25;
  }

  // Zip code (important, 25%)
  maxScore += 25;
  if (components.zipCode && /^\d{4}$/.test(components.zipCode)) {
    score += 25;
  }

  // Floor (optional, 10%)
  maxScore += 10;
  if (components.floor !== undefined) {
    score += 10;
  }

  // Door (optional, 10%)
  maxScore += 10;
  if (components.door !== undefined) {
    score += 10;
  }

  return maxScore > 0 ? score / maxScore : 0;
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate string similarity (0-1) based on Levenshtein distance
 */
export function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;

  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  if (aLower === bLower) return 1;

  const maxLen = Math.max(aLower.length, bLower.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(aLower, bLower);
  return 1 - distance / maxLen;
}
