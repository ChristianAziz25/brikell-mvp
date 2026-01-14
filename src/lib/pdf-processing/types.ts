import type { PdfJob, PdfParsedUnits, RentRollUnit } from "@/generated/client";

// Job status type
export type JobStatus =
  | "pending"
  | "processing"
  | "extracting"
  | "matching"
  | "completed"
  | "failed";

// Match status type
export type MatchStatusType = "pending" | "matched" | "missing" | "mismatched";

// Extracted unit from PDF (before DB insert)
export interface ExtractedUnit {
  unit_address?: string;
  unit_zipcode?: string;
  unit_door?: number;
  unit_floor?: number;
  size_sqm?: number;
  rent_current?: number;
  tenant_name?: string;
  lease_start?: string;
  lease_end?: string;
}

// LLM extraction result
export interface ExtractionResult {
  units: ExtractedUnit[];
  metadata: {
    pageCount: number;
    extractedAt: string;
    confidence: number;
  };
}

// Match result for a single unit
export interface MatchResult {
  unitId: number;
  confidence: number;
  method: "exact" | "fuzzy" | "composite";
}

// Matching statistics
export interface MatchingStats {
  totalPdfUnits: number;
  totalDbUnits: number;
  matched: number;
  missing: number;
  extra: number;
  avgConfidence: number;
}

// Full matching result stored in pdf_job.matching_result
export interface MatchingResult {
  stats: MatchingStats;
  processedAt: string;
}

// API response types
export interface JobCreateResponse {
  jobId: string;
  status: JobStatus;
  message: string;
}

export interface JobStatusResponse {
  id: string;
  status: JobStatus;
  progress: number;
  fileName: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  retryCount: number;
  summary?: string;
}

export interface PdfUnitResult {
  id: string;
  address: string | null;
  zipcode: string | null;
  floor: number | null;
  door: number | null;
  sizeSqm: number | null;
  rentCurrent: number | null;
  tenantName: string | null;
}

export interface DbUnitResult {
  unitId: number;
  address: string;
  zipcode: string;
  floor: number;
  door: number;
  sizeSqm: number;
  propertyName: string;
}

export interface MatchedUnit {
  pdfUnit: PdfUnitResult;
  dbUnit: DbUnitResult;
  confidence: number;
  method: string;
}

export interface JobResultsResponse {
  jobId: string;
  fileName: string;
  completedAt: string | null;
  matchedUnits: MatchedUnit[];
  missingInDb: PdfUnitResult[];
  extraInDb: DbUnitResult[];
  stats: MatchingStats;
  summary: string;
}

// DD Summary types
export interface DDSummary {
  propertyOverview: string;
  keyFinancials: string;
  rentRollHighlights: string;
  risksAndRedFlags: string;
  missingInformation: string;
}

export interface DDResultsResponse {
  jobId: string;
  fileName: string;
  completedAt: string;
  summary: DDSummary;
}

// Unit matching result for fast parsing (in-memory matching)
export interface UnitMatchResult {
  /** Units from PDF that were NOT found in database (anomalies) */
  unmatchedUnits: ExtractedUnit[];
  /** Number of units from PDF that matched database records */
  matchedCount: number;
  /** Total units extracted from PDF */
  totalExtracted: number;
  /** Whether any anomalies were found */
  hasAnomalies: boolean;
}

// Extended DD results with unit matching
export interface DDResultsWithUnits extends DDResultsResponse {
  unitMatching?: UnitMatchResult;
}
