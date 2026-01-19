// Diligence Module Types
// Types for BBR-style property data and risk analysis

import type {
  DiligenceProperty,
  DiligenceEnergyLabel,
  DiligenceZoning,
  DiligenceContamination,
  DiligenceValuation,
  DiligencePdfDocument,
  DiligencePdfExtraction,
  DiligenceRiskReport,
  ContaminationLevel,
  DiligenceRiskLevel,
} from '@/generated/client';

// Re-export Prisma types
export type {
  DiligenceProperty,
  DiligenceEnergyLabel,
  DiligenceZoning,
  DiligenceContamination,
  DiligenceValuation,
  DiligencePdfDocument,
  DiligencePdfExtraction,
  DiligenceRiskReport,
  ContaminationLevel,
  DiligenceRiskLevel,
};

// Property with all related data
export interface DiligencePropertyWithRelations extends DiligenceProperty {
  energyLabels: DiligenceEnergyLabel[];
  zoningData: DiligenceZoning[];
  contaminationData: DiligenceContamination[];
  valuations: DiligenceValuation[];
  pdfDocuments: DiligencePdfDocument[];
  riskReports: DiligenceRiskReport[];
}

// Input types for creating/updating
export interface CreatePropertyInput {
  address: string;
  postalCode: string;
  city: string;
  municipalityCode?: string;
  cadastralNumber?: string;
  buildingYear?: number;
  grossAreaM2?: number;
  primaryUse?: string;
  heatingType?: string;
}

export interface CreateEnergyLabelInput {
  propertyId: string;
  label: string;
  lastInspectionDate?: Date;
  annualEnergyConsumptionKwh?: number;
  improvementRecommendations?: unknown;
}

export interface CreateZoningInput {
  propertyId: string;
  lokalplanUse?: string;
  lokalplanId?: string;
  maxFloors?: number;
  maxHeightM?: number;
  notes?: string;
}

export interface CreateContaminationInput {
  propertyId: string;
  contaminationLevel: ContaminationLevel;
  sourceSystem?: string;
  notes?: string;
}

export interface CreateValuationInput {
  propertyId: string;
  publicValuationAmount?: number;
  valuationYear?: number;
  valuationMethod?: string;
}

// Structured fields extracted from PDF
export interface PdfStructuredFields {
  area?: number;
  rent?: number;
  use?: string;
  tenantName?: string;
  leaseStart?: string;
  leaseEnd?: string;
  additionalFields?: Record<string, unknown>;
}

// BBR (Building and Housing Registry) source data
export interface BBRSourceData {
  livingAreaM2: number | null;
  commercialAreaM2: number | null;
  numberOfFloors: number | null;
  roofMaterial: string | null;
  wallMaterial: string | null;
  waterSupply: string | null;
  drainage: string | null;
  contaminationCode: string | null;
  bfeNumber: number | null;
  fetchedAt: Date;
}

// BBR data discrepancy between official registry and existing data
export interface BBRDiscrepancy {
  field: string;
  bbrValue: string | number | null;
  existingValue: string | number | null;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

// Risk Analysis Types
export type RiskSeverity = 'low' | 'medium' | 'high';

export interface RiskItem {
  id: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  evidence: string;
}

export interface RiskAnalysisResult {
  risks: RiskItem[];
  overall_risk_level: 'Groen' | 'Gul' | 'Roed';
  summary_bullets: string[];
  danish_summary: string;
}

// Input for risk analysis
export interface RiskAnalysisInput {
  propertyData: {
    address: string;
    postalCode: string;
    city: string;
    municipalityCode?: string | null;
    cadastralNumber?: string | null;
    buildingYear?: number | null;
    grossAreaM2?: number | null;
    primaryUse?: string | null;
    heatingType?: string | null;
  };
  energyLabel?: {
    label: string;
    lastInspectionDate?: Date | null;
    annualEnergyConsumptionKwh?: number | null;
    improvementRecommendations?: unknown;
  } | null;
  zoningData?: {
    lokalplanUse?: string | null;
    lokalplanId?: string | null;
    maxFloors?: number | null;
    maxHeightM?: number | null;
    notes?: string | null;
  } | null;
  contaminationData?: {
    contaminationLevel: ContaminationLevel;
    sourceSystem?: string | null;
    notes?: string | null;
  } | null;
  registryValuation?: {
    publicValuationAmount?: number | null;
    valuationYear?: number | null;
    valuationMethod?: string | null;
  } | null;
  pdfExtraction?: {
    rawText: string | null;
    structuredFields?: PdfStructuredFields | null;
  } | null;
  // Official BBR data from Datafordeler
  bbrData?: BBRSourceData;
  // Discrepancies between BBR and existing property data
  bbrDiscrepancies?: BBRDiscrepancy[];
}

// API Response types
export interface PropertyListResponse {
  properties: DiligenceProperty[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PropertyDetailResponse {
  property: DiligencePropertyWithRelations;
}

export interface PdfUploadResponse {
  pdfDocument: DiligencePdfDocument;
  message: string;
}

export interface PdfExtractResponse {
  extraction: DiligencePdfExtraction;
  message: string;
}

export interface RiskAnalysisResponse {
  report: DiligenceRiskReport;
  analysis: RiskAnalysisResult;
}

// Risk level display mapping
export const RISK_LEVEL_DISPLAY: Record<DiligenceRiskLevel | string, { label: string; color: string; bgColor: string }> = {
  Groen: { label: 'Grøn', color: 'text-green-700', bgColor: 'bg-green-100' },
  Gul: { label: 'Gul', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  Roed: { label: 'Rød', color: 'text-red-700', bgColor: 'bg-red-100' },
};

// Severity display mapping
export const SEVERITY_DISPLAY: Record<RiskSeverity, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Lav', color: 'text-green-700', bgColor: 'bg-green-100' },
  medium: { label: 'Middel', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  high: { label: 'Høj', color: 'text-red-700', bgColor: 'bg-red-100' },
};

// Primary use options (Danish)
export const PRIMARY_USE_OPTIONS = [
  { value: 'residential', label: 'Bolig' },
  { value: 'office', label: 'Kontor' },
  { value: 'retail', label: 'Detail' },
  { value: 'industrial', label: 'Industri' },
  { value: 'mixed', label: 'Blandet' },
  { value: 'other', label: 'Andet' },
];

// Heating type options (Danish)
export const HEATING_TYPE_OPTIONS = [
  { value: 'district', label: 'Fjernvarme' },
  { value: 'gas', label: 'Naturgas' },
  { value: 'oil', label: 'Oliefyr' },
  { value: 'electricity', label: 'El' },
  { value: 'heat_pump', label: 'Varmepumpe' },
  { value: 'other', label: 'Andet' },
];

// Energy label options
export const ENERGY_LABEL_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

// Contamination level options (Danish)
export const CONTAMINATION_LEVEL_OPTIONS: { value: ContaminationLevel; label: string; description: string }[] = [
  { value: 'None', label: 'Ingen', description: 'Ingen registreret forurening' },
  { value: 'V1', label: 'V1', description: 'Kortlagt på vidensniveau 1 - mulig forurening' },
  { value: 'V2', label: 'V2', description: 'Kortlagt på vidensniveau 2 - konstateret forurening' },
];
