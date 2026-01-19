// BBR Service
// High-level service for querying Danish Building and Housing Registry (BBR) data

import {
  searchBygninger,
  searchEnheder,
  searchGrunde,
  searchEjendomsrelationer,
  getBygningById,
  getGrundById,
  hasCredentials,
  DatafordelerError,
} from './client';
import { mapBBRToProperty } from './mappers';
import type {
  BBRBygning,
  BBREnhed,
  BBRGrund,
  BBREjendomsrelation,
  BBRPropertyData,
  BBRMappedData,
} from './types';

/**
 * Error thrown when BBR service cannot fulfill a request
 */
export class BBRServiceError extends Error {
  constructor(
    message: string,
    public code: 'NO_CREDENTIALS' | 'NOT_FOUND' | 'MULTIPLE_MATCHES' | 'API_ERROR'
  ) {
    super(message);
    this.name = 'BBRServiceError';
  }
}

/**
 * Address components for BBR lookup
 */
export interface AddressLookup {
  streetName: string;
  houseNumber: string;
  postalCode: string;
}

/**
 * Cadastral components for BBR lookup
 */
export interface CadastralLookup {
  municipalityCode: string;
  cadastralNumber: string;
  cadastralDistrictCode?: number;
}

/**
 * Parse a full address string into components
 * Handles common Danish address formats:
 * - "Vestergade 10, 1456 København"
 * - "Vestergade 10A, 1456 København K"
 * - "Vestergade 10, 2. th, 1456 København"
 */
function parseAddress(address: string, postalCode: string): AddressLookup {
  // Remove extra whitespace
  const cleaned = address.trim().replace(/\s+/g, ' ');

  // Try to extract street name and house number
  // Common pattern: "Street Name 123A" or "Street Name 123"
  const match = cleaned.match(/^(.+?)\s+(\d+\s*[A-Za-z]?)(?:,|\s|$)/);

  if (match) {
    return {
      streetName: match[1].trim(),
      houseNumber: match[2].replace(/\s/g, '').toUpperCase(),
      postalCode: postalCode.replace(/\s/g, ''),
    };
  }

  // Fallback: use the whole address as street name
  return {
    streetName: cleaned.split(',')[0].trim(),
    houseNumber: '',
    postalCode: postalCode.replace(/\s/g, ''),
  };
}

/**
 * Look up a building by address
 * Returns the building data and associated plot/units if found
 */
export async function getBygningByAddress(
  address: string,
  postalCode: string
): Promise<BBRPropertyData | null> {
  if (!hasCredentials()) {
    throw new BBRServiceError(
      'Datafordeler credentials not configured',
      'NO_CREDENTIALS'
    );
  }

  const parsedAddress = parseAddress(address, postalCode);
  console.log('Looking up BBR by address:', parsedAddress);

  try {
    // Search for buildings using the address reference
    // The BBR API uses DAR (Danish Address Registry) references
    // We need to search using husnummer which is a DAR ID
    // For now, we'll search by municipality and try to match

    // First, try to find via municipality code derived from postal code
    // Danish postal codes roughly map to municipalities
    // This is a simplified approach - full implementation would use DAR API

    // Search for buildings in the area
    const bygninger = await searchBygninger({
      pagesize: 20,
    });

    if (bygninger.length === 0) {
      return null;
    }

    // For now, return the first building found
    // A full implementation would cross-reference with DAR API
    const bygning = bygninger[0];

    // Get associated data
    const propertyData = await getFullPropertyDataByBygning(bygning);
    return propertyData;
  } catch (error) {
    if (error instanceof DatafordelerError) {
      throw new BBRServiceError(
        `BBR API error: ${error.message}`,
        'API_ERROR'
      );
    }
    throw error;
  }
}

/**
 * Look up a building by cadastral number
 * This is the most reliable lookup method
 */
export async function getBygningByCadastral(
  municipalityCode: string,
  cadastralNumber: string,
  cadastralDistrictCode?: number
): Promise<BBRPropertyData | null> {
  if (!hasCredentials()) {
    throw new BBRServiceError(
      'Datafordeler credentials not configured',
      'NO_CREDENTIALS'
    );
  }

  console.log('Looking up BBR by cadastral:', { municipalityCode, cadastralNumber, cadastralDistrictCode });

  try {
    // First, find the Grund (plot) by cadastral number
    const grunde = await searchGrunde({
      kommunekode: municipalityCode,
      matrikelnummer: cadastralNumber,
      ejerlavskode: cadastralDistrictCode,
      pagesize: 10,
    });

    if (grunde.length === 0) {
      return null;
    }

    const grund = grunde[0];

    // Now find buildings on this plot
    // Buildings reference their plot via the 'grund' field
    const bygninger = await searchBygninger({
      kommunekode: municipalityCode,
      pagesize: 50,
    });

    // Filter to buildings that reference this plot
    const matchingBygninger = bygninger.filter(
      (b) => b.grund === grund.id_lokalId
    );

    if (matchingBygninger.length === 0) {
      // Return just the plot data if no buildings found
      return {
        bygning: null,
        enheder: [],
        grund,
        ejendomsrelation: null,
        fetchedAt: new Date(),
        source: 'datafordeler',
      };
    }

    // Use the first matching building (typically there's only one main building)
    const bygning = matchingBygninger[0];

    return await getFullPropertyDataByBygning(bygning, grund);
  } catch (error) {
    if (error instanceof DatafordelerError) {
      throw new BBRServiceError(
        `BBR API error: ${error.message}`,
        'API_ERROR'
      );
    }
    throw error;
  }
}

/**
 * Get all units within a building
 */
export async function getEnhederByBygning(
  bygningId: string
): Promise<BBREnhed[]> {
  if (!hasCredentials()) {
    throw new BBRServiceError(
      'Datafordeler credentials not configured',
      'NO_CREDENTIALS'
    );
  }

  try {
    return await searchEnheder({
      bygning: bygningId,
      pagesize: 200, // Buildings can have many units
    });
  } catch (error) {
    if (error instanceof DatafordelerError) {
      throw new BBRServiceError(
        `BBR API error: ${error.message}`,
        'API_ERROR'
      );
    }
    throw error;
  }
}

/**
 * Get full property data for a building including plot and units
 */
async function getFullPropertyDataByBygning(
  bygning: BBRBygning,
  existingGrund?: BBRGrund
): Promise<BBRPropertyData> {
  // Get or fetch the plot (Grund)
  let grund = existingGrund ?? null;
  if (!grund && bygning.grund) {
    grund = await getGrundById(bygning.grund);
  }

  // Get units in the building
  const enheder = await getEnhederByBygning(bygning.id_lokalId);

  // Try to get property relation
  let ejendomsrelation: BBREjendomsrelation | null = null;
  if (bygning.kommunekode) {
    const relationer = await searchEjendomsrelationer({
      kommunekode: bygning.kommunekode,
      pagesize: 10,
    });
    // Find relation that includes this building
    ejendomsrelation = relationer.find(
      (r) => r.bygning?.includes(bygning.id_lokalId)
    ) ?? null;
  }

  return {
    bygning,
    enheder,
    grund,
    ejendomsrelation,
    fetchedAt: new Date(),
    source: 'datafordeler',
  };
}

/**
 * Get full property data combining building, plot, and unit information
 * This is the main entry point for most use cases
 */
export async function getFullPropertyData(
  address: string,
  postalCode: string
): Promise<BBRMappedData | null> {
  const rawData = await getBygningByAddress(address, postalCode);

  if (!rawData) {
    return null;
  }

  return mapBBRToProperty(rawData);
}

/**
 * Get full property data by cadastral reference
 * More reliable than address-based lookup
 */
export async function getFullPropertyDataByCadastral(
  municipalityCode: string,
  cadastralNumber: string,
  cadastralDistrictCode?: number
): Promise<BBRMappedData | null> {
  const rawData = await getBygningByCadastral(
    municipalityCode,
    cadastralNumber,
    cadastralDistrictCode
  );

  if (!rawData) {
    return null;
  }

  return mapBBRToProperty(rawData);
}

/**
 * Get building by its ID directly
 */
export async function getPropertyByBygningId(
  bygningId: string
): Promise<BBRMappedData | null> {
  if (!hasCredentials()) {
    throw new BBRServiceError(
      'Datafordeler credentials not configured',
      'NO_CREDENTIALS'
    );
  }

  try {
    const bygning = await getBygningById(bygningId);

    if (!bygning) {
      return null;
    }

    const rawData = await getFullPropertyDataByBygning(bygning);
    return mapBBRToProperty(rawData);
  } catch (error) {
    if (error instanceof DatafordelerError) {
      throw new BBRServiceError(
        `BBR API error: ${error.message}`,
        'API_ERROR'
      );
    }
    throw error;
  }
}
