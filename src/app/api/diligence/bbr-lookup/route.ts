import { NextRequest, NextResponse } from 'next/server';
import {
  getFullPropertyData,
  getFullPropertyDataByCadastral,
  BBRServiceError,
} from '@/lib/datafordeler/bbr-service';
import { hasCredentials } from '@/lib/datafordeler/client';
import { compareWithExistingData } from '@/lib/datafordeler/mappers';
import { getPropertyById, updateProperty } from '@/lib/prisma/models/diligenceProperty';

/**
 * POST /api/diligence/bbr-lookup
 *
 * Look up official BBR data from Datafordeler.dk
 *
 * Request body options:
 * 1. By property ID: { propertyId: string }
 *    - Fetches property from DB, uses its address/cadastral to look up BBR
 * 2. By address: { address: string, postalCode: string }
 *    - Direct address-based lookup
 * 3. By cadastral: { municipalityCode: string, cadastralNumber: string }
 *    - Direct cadastral-based lookup (most reliable)
 *
 * Query params:
 * - updateProperty=true: Update the property record with BBR data
 *
 * Response:
 * {
 *   bbrData: BBRMappedData,
 *   discrepancies: BBRDiscrepancy[] (only if propertyId provided),
 *   propertyUpdated: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check credentials first
    if (!hasCredentials()) {
      return NextResponse.json(
        {
          error: 'Datafordeler credentials not configured',
          hint: 'Set DATAFORDELER_USERNAME and DATAFORDELER_PASSWORD in your environment',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { propertyId, address, postalCode, municipalityCode, cadastralNumber } = body;

    // Check if we should update the property after lookup
    const searchParams = request.nextUrl.searchParams;
    const shouldUpdateProperty = searchParams.get('updateProperty') === 'true';

    let bbrData;
    let existingProperty = null;
    let discrepancies: ReturnType<typeof compareWithExistingData> = [];

    // Option 1: Lookup by property ID
    if (propertyId) {
      existingProperty = await getPropertyById(propertyId);

      if (!existingProperty) {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        );
      }

      // Prefer cadastral-based lookup if we have the data
      if (existingProperty.municipalityCode && existingProperty.cadastralNumber) {
        bbrData = await getFullPropertyDataByCadastral(
          existingProperty.municipalityCode,
          existingProperty.cadastralNumber
        );
      } else {
        // Fall back to address-based lookup
        bbrData = await getFullPropertyData(
          existingProperty.address,
          existingProperty.postalCode
        );
      }

      // Compare BBR data with existing property data
      if (bbrData) {
        discrepancies = compareWithExistingData(bbrData, {
          municipalityCode: existingProperty.municipalityCode,
          cadastralNumber: existingProperty.cadastralNumber,
          buildingYear: existingProperty.buildingYear,
          grossAreaM2: existingProperty.grossAreaM2,
          primaryUse: existingProperty.primaryUse,
          heatingType: existingProperty.heatingType,
        });
      }
    }
    // Option 2: Lookup by cadastral reference
    else if (municipalityCode && cadastralNumber) {
      bbrData = await getFullPropertyDataByCadastral(municipalityCode, cadastralNumber);
    }
    // Option 3: Lookup by address
    else if (address && postalCode) {
      bbrData = await getFullPropertyData(address, postalCode);
    }
    // No valid lookup parameters
    else {
      return NextResponse.json(
        {
          error: 'Invalid request',
          hint: 'Provide either propertyId, (address + postalCode), or (municipalityCode + cadastralNumber)',
        },
        { status: 400 }
      );
    }

    if (!bbrData) {
      return NextResponse.json(
        {
          error: 'Property not found in BBR',
          hint: 'The address or cadastral reference could not be found in the Danish Building Registry',
        },
        { status: 404 }
      );
    }

    // Optionally update the property with BBR data
    let propertyUpdated = false;
    if (shouldUpdateProperty && propertyId && existingProperty) {
      const updateData: Record<string, unknown> = {};

      // Only update fields that are missing or if BBR has more specific data
      if (!existingProperty.municipalityCode && bbrData.municipalityCode) {
        updateData.municipalityCode = bbrData.municipalityCode;
      }
      if (!existingProperty.cadastralNumber && bbrData.cadastralNumber) {
        updateData.cadastralNumber = bbrData.cadastralNumber;
      }
      if (!existingProperty.buildingYear && bbrData.buildingYear) {
        updateData.buildingYear = bbrData.buildingYear;
      }
      if (!existingProperty.grossAreaM2 && bbrData.grossAreaM2) {
        updateData.grossAreaM2 = bbrData.grossAreaM2;
      }
      if (!existingProperty.primaryUse && bbrData.primaryUse) {
        updateData.primaryUse = bbrData.primaryUse;
      }
      if (!existingProperty.heatingType && bbrData.heatingType) {
        updateData.heatingType = bbrData.heatingType;
      }

      if (Object.keys(updateData).length > 0) {
        await updateProperty(propertyId, updateData);
        propertyUpdated = true;
      }
    }

    // Build response - exclude raw data to reduce payload size
    const response: {
      bbrData: Omit<typeof bbrData, 'raw'> & { fetchedAt: string };
      discrepancies?: typeof discrepancies;
      propertyUpdated: boolean;
    } = {
      bbrData: {
        municipalityCode: bbrData.municipalityCode,
        cadastralNumber: bbrData.cadastralNumber,
        cadastralDistrict: bbrData.cadastralDistrict,
        buildingYear: bbrData.buildingYear,
        grossAreaM2: bbrData.grossAreaM2,
        livingAreaM2: bbrData.livingAreaM2,
        commercialAreaM2: bbrData.commercialAreaM2,
        numberOfFloors: bbrData.numberOfFloors,
        primaryUse: bbrData.primaryUse,
        primaryUseCode: bbrData.primaryUseCode,
        heatingType: bbrData.heatingType,
        heatingTypeCode: bbrData.heatingTypeCode,
        roofMaterial: bbrData.roofMaterial,
        wallMaterial: bbrData.wallMaterial,
        waterSupply: bbrData.waterSupply,
        drainage: bbrData.drainage,
        contaminationCode: bbrData.contaminationCode,
        bfeNumber: bbrData.bfeNumber,
        fetchedAt: bbrData.raw.fetchedAt.toISOString(),
      },
      propertyUpdated,
    };

    if (discrepancies.length > 0) {
      response.discrepancies = discrepancies;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('BBR lookup error:', error);

    if (error instanceof BBRServiceError) {
      const status = error.code === 'NO_CREDENTIALS' ? 503 : 500;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status }
      );
    }

    return NextResponse.json(
      { error: 'BBR lookup failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/diligence/bbr-lookup
 *
 * Check if BBR lookup is available (credentials configured)
 */
export async function GET() {
  const credentialsConfigured = hasCredentials();

  return NextResponse.json({
    available: credentialsConfigured,
    message: credentialsConfigured
      ? 'BBR lookup is available'
      : 'Datafordeler credentials not configured',
  });
}
