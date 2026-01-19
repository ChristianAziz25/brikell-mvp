import { NextRequest, NextResponse } from 'next/server';
import { runClaudeRiskAnalysis } from '@/lib/ai/claude';
import {
  getPropertyDataForRiskAnalysis,
  getLatestExtractionForDocument,
  createRiskReport,
} from '@/lib/prisma/models/diligenceProperty';
import type { RiskAnalysisInput, PdfStructuredFields } from '@/lib/diligence/types';
import { hasCredentials } from '@/lib/datafordeler/client';
import {
  getFullPropertyData,
  getFullPropertyDataByCadastral,
} from '@/lib/datafordeler/bbr-service';
import { compareWithExistingData, type BBRDiscrepancy } from '@/lib/datafordeler/mappers';
import type { BBRMappedData } from '@/lib/datafordeler/types';

/**
 * POST /api/diligence/risk-analysis
 * Run AI risk analysis on a property with optional PDF data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, pdfDocumentId } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'propertyId is required' },
        { status: 400 }
      );
    }

    // Get property data with related tables
    const propertyData = await getPropertyDataForRiskAnalysis(propertyId);
    if (!propertyData) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Fetch fresh BBR data if credentials are configured
    let bbrData: BBRMappedData | null = null;
    let bbrDiscrepancies: BBRDiscrepancy[] = [];

    if (hasCredentials()) {
      try {
        // Prefer cadastral-based lookup if we have the data
        if (propertyData.property.municipalityCode && propertyData.property.cadastralNumber) {
          bbrData = await getFullPropertyDataByCadastral(
            propertyData.property.municipalityCode,
            propertyData.property.cadastralNumber
          );
        } else {
          // Fall back to address-based lookup
          bbrData = await getFullPropertyData(
            propertyData.property.address,
            propertyData.property.postalCode
          );
        }

        // Compare BBR data with property data to find discrepancies
        if (bbrData) {
          bbrDiscrepancies = compareWithExistingData(bbrData, {
            municipalityCode: propertyData.property.municipalityCode,
            cadastralNumber: propertyData.property.cadastralNumber,
            buildingYear: propertyData.property.buildingYear,
            grossAreaM2: propertyData.property.grossAreaM2,
            primaryUse: propertyData.property.primaryUse,
            heatingType: propertyData.property.heatingType,
          });
        }
      } catch (bbrError) {
        console.warn('BBR lookup failed, continuing without BBR data:', bbrError);
        // Continue without BBR data - it's optional
      }
    }

    // Build the risk analysis input
    const analysisInput: RiskAnalysisInput = {
      propertyData: {
        address: propertyData.property.address,
        postalCode: propertyData.property.postalCode,
        city: propertyData.property.city,
        municipalityCode: bbrData?.municipalityCode ?? propertyData.property.municipalityCode,
        cadastralNumber: bbrData?.cadastralNumber ?? propertyData.property.cadastralNumber,
        buildingYear: bbrData?.buildingYear ?? propertyData.property.buildingYear,
        grossAreaM2: bbrData?.grossAreaM2 ?? propertyData.property.grossAreaM2,
        primaryUse: bbrData?.primaryUse ?? propertyData.property.primaryUse,
        heatingType: bbrData?.heatingType ?? propertyData.property.heatingType,
      },
      // Include BBR-specific data if available
      bbrData: bbrData ? {
        livingAreaM2: bbrData.livingAreaM2,
        commercialAreaM2: bbrData.commercialAreaM2,
        numberOfFloors: bbrData.numberOfFloors,
        roofMaterial: bbrData.roofMaterial,
        wallMaterial: bbrData.wallMaterial,
        waterSupply: bbrData.waterSupply,
        drainage: bbrData.drainage,
        contaminationCode: bbrData.contaminationCode,
        bfeNumber: bbrData.bfeNumber,
        fetchedAt: bbrData.raw.fetchedAt,
      } : undefined,
      // Include any discrepancies found between BBR and existing data
      bbrDiscrepancies: bbrDiscrepancies.length > 0 ? bbrDiscrepancies : undefined,
    };

    // Add energy label data if available
    if (propertyData.energyLabel) {
      analysisInput.energyLabel = {
        label: propertyData.energyLabel.label,
        lastInspectionDate: propertyData.energyLabel.lastInspectionDate,
        annualEnergyConsumptionKwh: propertyData.energyLabel.annualEnergyConsumptionKwh,
        improvementRecommendations: propertyData.energyLabel.improvementRecommendations,
      };
    }

    // Add zoning data if available
    if (propertyData.zoning) {
      analysisInput.zoningData = {
        lokalplanUse: propertyData.zoning.lokalplanUse,
        lokalplanId: propertyData.zoning.lokalplanId,
        maxFloors: propertyData.zoning.maxFloors,
        maxHeightM: propertyData.zoning.maxHeightM,
        notes: propertyData.zoning.notes,
      };
    }

    // Add contamination data if available
    if (propertyData.contamination) {
      analysisInput.contaminationData = {
        contaminationLevel: propertyData.contamination.contaminationLevel,
        sourceSystem: propertyData.contamination.sourceSystem,
        notes: propertyData.contamination.notes,
      };
    }

    // Add valuation data if available
    if (propertyData.valuation) {
      analysisInput.registryValuation = {
        publicValuationAmount: propertyData.valuation.publicValuationAmount,
        valuationYear: propertyData.valuation.valuationYear,
        valuationMethod: propertyData.valuation.valuationMethod,
      };
    }

    // Add PDF extraction data if a document was specified
    if (pdfDocumentId) {
      const extraction = await getLatestExtractionForDocument(pdfDocumentId);
      if (extraction) {
        analysisInput.pdfExtraction = {
          rawText: extraction.rawText,
          structuredFields: extraction.structuredFields as PdfStructuredFields | null,
        };
      }
    }

    // Run the Claude risk analysis
    let analysis;
    try {
      analysis = await runClaudeRiskAnalysis(analysisInput);
    } catch (claudeError) {
      console.error('Claude API error:', claudeError);
      return NextResponse.json(
        { error: 'AI analysis failed. Please check your API key and try again.' },
        { status: 503 }
      );
    }

    // Save the risk report to the database
    const report = await createRiskReport({
      propertyId,
      pdfDocumentId: pdfDocumentId || undefined,
      aiSummary: analysis.danish_summary,
      aiRiskJson: analysis as unknown as import('@/generated/client').Prisma.InputJsonValue,
      overallRiskLevel: analysis.overall_risk_level,
    });

    // Build response with optional BBR data
    const response: {
      report: typeof report;
      analysis: typeof analysis;
      bbrData?: {
        municipalityCode: string | null;
        cadastralNumber: string | null;
        buildingYear: number | null;
        grossAreaM2: number | null;
        primaryUse: string | null;
        heatingType: string | null;
        fetchedAt: string;
      };
      bbrDiscrepancies?: BBRDiscrepancy[];
    } = {
      report,
      analysis,
    };

    if (bbrData) {
      response.bbrData = {
        municipalityCode: bbrData.municipalityCode,
        cadastralNumber: bbrData.cadastralNumber,
        buildingYear: bbrData.buildingYear,
        grossAreaM2: bbrData.grossAreaM2,
        primaryUse: bbrData.primaryUse,
        heatingType: bbrData.heatingType,
        fetchedAt: bbrData.raw.fetchedAt.toISOString(),
      };
    }

    if (bbrDiscrepancies.length > 0) {
      response.bbrDiscrepancies = bbrDiscrepancies;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error running risk analysis:', error);
    return NextResponse.json(
      { error: 'Failed to run risk analysis' },
      { status: 500 }
    );
  }
}
