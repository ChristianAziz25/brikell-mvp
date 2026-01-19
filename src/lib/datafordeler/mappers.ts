// BBR Code Mappers
// Maps BBR numeric codes to human-readable values
// Reference: https://bbr.dk/forside/0/2

import type { BBRPropertyData, BBRMappedData } from './types';

/**
 * Building usage codes (byg021BygningensAnvendelse)
 * Maps BBR usage codes to our internal primaryUse values
 */
export const BUILDING_USAGE_CODES: Record<string, { internal: string; danish: string }> = {
  // Residential
  '110': { internal: 'residential', danish: 'Stuehus til landbrugsejendom' },
  '120': { internal: 'residential', danish: 'Fritliggende enfamilieshus' },
  '130': { internal: 'residential', danish: 'Række-, kæde-, dobbelthus' },
  '140': { internal: 'residential', danish: 'Etageboligbebyggelse' },
  '150': { internal: 'residential', danish: 'Kollegium' },
  '160': { internal: 'residential', danish: 'Døgninstitution' },
  '185': { internal: 'residential', danish: 'Anneks i tilknytning til helårsbolig' },
  '190': { internal: 'residential', danish: 'Anden bygning til helårsbeboelse' },

  // Office / Commercial
  '310': { internal: 'office', danish: 'Transport- og garageanlæg' },
  '320': { internal: 'office', danish: 'Kontor- og administration' },
  '321': { internal: 'office', danish: 'Pengeinstitut, forsikringsselskab mv.' },
  '322': { internal: 'office', danish: 'Kontor i forbindelse med industriel produktion' },
  '323': { internal: 'office', danish: 'Offentlig administration' },
  '324': { internal: 'office', danish: 'Liberale erhverv' },
  '329': { internal: 'office', danish: 'Anden administration og kontor' },

  // Retail
  '330': { internal: 'retail', danish: 'Butikker til detailhandel' },
  '331': { internal: 'retail', danish: 'Stormagasin, varehus' },
  '332': { internal: 'retail', danish: 'Butikscenter, -Loss' },
  '333': { internal: 'retail', danish: 'Tankstation' },
  '334': { internal: 'retail', danish: 'Butik til engroshandel' },
  '339': { internal: 'retail', danish: 'Anden butik' },

  // Industrial
  '210': { internal: 'industrial', danish: 'Erhvervsmæssig produktion vedr. landbrug' },
  '211': { internal: 'industrial', danish: 'Stald til svin' },
  '212': { internal: 'industrial', danish: 'Stald til kvæg' },
  '213': { internal: 'industrial', danish: 'Stald til fjerkræ' },
  '214': { internal: 'industrial', danish: 'Minkhal' },
  '215': { internal: 'industrial', danish: 'Stald til får, geder, heste mv.' },
  '216': { internal: 'industrial', danish: 'Lade, maskinhus, garage mv.' },
  '217': { internal: 'industrial', danish: 'Gyllebeholder' },
  '218': { internal: 'industrial', danish: 'Møddingsplads' },
  '219': { internal: 'industrial', danish: 'Anden bygning til landbrug' },
  '220': { internal: 'industrial', danish: 'Erhvervsmæssig produktion vedr. industri' },
  '221': { internal: 'industrial', danish: 'Fabrik, værksted mv.' },
  '222': { internal: 'industrial', danish: 'El-, gas-, vand- eller varmeværk' },
  '223': { internal: 'industrial', danish: 'Vindmølle' },
  '229': { internal: 'industrial', danish: 'Anden bygning til industri' },

  // Mixed use
  '410': { internal: 'mixed', danish: 'Blandet bolig og erhverv' },
  '411': { internal: 'mixed', danish: 'Blandet bolig og butik' },
  '412': { internal: 'mixed', danish: 'Blandet bolig og kontor' },
  '413': { internal: 'mixed', danish: 'Blandet bolig og industri' },
  '419': { internal: 'mixed', danish: 'Blandet bolig og erhverv i øvrigt' },

  // Summer houses and vacation (500-series)
  '510': { internal: 'residential', danish: 'Sommerhus' },
  '520': { internal: 'other', danish: 'Vandrehjem, feriecenter, camping' },

  // Hospitality and culture (600-series)
  '610': { internal: 'other', danish: 'Hotel, kro, konferencecenter' },
  '620': { internal: 'other', danish: 'Restaurant, cafeteria, grillbar' },
  '630': { internal: 'other', danish: 'Museum, bibliotek, kirke' },
  '640': { internal: 'other', danish: 'Forsamlingshus' },
  '585': { internal: 'residential', danish: 'Kolonihavehus' },
  '590': { internal: 'other', danish: 'Anden bygning til kulturelle formål' },
};

/**
 * Heating installation codes (byg056Varmeinstallation)
 */
export const HEATING_INSTALLATION_CODES: Record<string, { internal: string; danish: string }> = {
  '1': { internal: 'district', danish: 'Fjernvarme/blokvarme' },
  '2': { internal: 'other', danish: 'Centralvarme med én fyringsenhed' },
  '3': { internal: 'other', danish: 'Ovne' },
  '5': { internal: 'other', danish: 'Varmepumpe' },
  '6': { internal: 'electricity', danish: 'Centralvarme med to fyringsenheder' },
  '7': { internal: 'other', danish: 'Ingen varmeinstallation' },
  '9': { internal: 'other', danish: 'Blandet' },
  '99': { internal: 'other', danish: 'Ukendt' },
};

/**
 * Heating fuel codes (byg057Opvarmningsmiddel)
 */
export const HEATING_FUEL_CODES: Record<string, { internal: string; danish: string }> = {
  '1': { internal: 'gas', danish: 'Gas' },
  '2': { internal: 'oil', danish: 'Olie' },
  '3': { internal: 'electricity', danish: 'Elektricitet' },
  '4': { internal: 'other', danish: 'Fast brændsel' },
  '6': { internal: 'other', danish: 'Halm' },
  '7': { internal: 'heat_pump', danish: 'Varmepumpe' },
  '9': { internal: 'other', danish: 'Andet' },
  '99': { internal: 'other', danish: 'Ukendt' },
};

/**
 * Roof material codes (byg033Tagdækningsmateriale)
 */
export const ROOF_MATERIAL_CODES: Record<string, string> = {
  '1': 'Tagpap (med lille hældning)',
  '2': 'Tagpap (med stor hældning)',
  '3': 'Fibercement (herunder eternit)',
  '4': 'Cementsten',
  '5': 'Tegl',
  '6': 'Metal (aluminium, kobber, zink)',
  '7': 'Stråtag',
  '10': 'Glas',
  '11': 'Levende tag (grønt tag)',
  '12': 'PVC',
  '20': 'Andet materiale',
  '80': 'Ingen tag',
  '90': 'Blandet',
};

/**
 * Wall material codes (byg035YdervæsMateriale)
 */
export const WALL_MATERIAL_CODES: Record<string, string> = {
  '1': 'Mursten',
  '2': 'Letbeton',
  '3': 'Fibercement (herunder eternit)',
  '4': 'Bindingsværk/træ',
  '5': 'Beton',
  '6': 'Metal',
  '8': 'Glas',
  '10': 'Andet materiale',
  '11': 'PVC',
  '90': 'Blandet',
};

/**
 * Water supply codes (gru020Vandforsyning)
 */
export const WATER_SUPPLY_CODES: Record<string, string> = {
  '1': 'Alment vandforsyningsanlæg',
  '2': 'Privat alment vandforsyningsanlæg',
  '3': 'Vandindvindingsanlæg på egen grund',
  '4': 'Brønd',
  '6': 'Ikke oplyst',
  '9': 'Ingen vandforsyning',
};

/**
 * Drainage codes (gru021Afløbsforhold)
 */
export const DRAINAGE_CODES: Record<string, string> = {
  '1': 'Offentligt kloakeret, spildevand og regnvand',
  '2': 'Offentligt kloakeret, kun spildevand',
  '3': 'Privat kloakeret',
  '4': 'Nedsivsning',
  '5': 'Samletank',
  '6': 'Mekanisk rensning',
  '7': 'Udledning til vandløb, sø, hav',
  '9': 'Ikke oplyst / intet afløb',
  '10': 'Biologisk rensning',
  '90': 'Blandet',
};

/**
 * Contamination codes (gru500Forurening)
 */
export const CONTAMINATION_CODES: Record<string, string> = {
  '0': 'Ikke kortlagt',
  '1': 'V1 - Mulig forurening',
  '2': 'V2 - Konstateret forurening',
};

/**
 * Map a building usage code to internal value
 */
export function mapBuildingUsage(code: string | undefined): string | null {
  if (!code) return null;
  return BUILDING_USAGE_CODES[code]?.internal ?? 'other';
}

/**
 * Map a building usage code to Danish description
 */
export function mapBuildingUsageDanish(code: string | undefined): string | null {
  if (!code) return null;
  return BUILDING_USAGE_CODES[code]?.danish ?? 'Ukendt';
}

/**
 * Map heating codes to internal value
 * Combines installation and fuel codes for best match
 */
export function mapHeatingType(
  installationCode: string | undefined,
  fuelCode: string | undefined
): string | null {
  // Prioritize fuel code if available
  if (fuelCode && HEATING_FUEL_CODES[fuelCode]) {
    return HEATING_FUEL_CODES[fuelCode].internal;
  }

  // Fall back to installation code
  if (installationCode && HEATING_INSTALLATION_CODES[installationCode]) {
    return HEATING_INSTALLATION_CODES[installationCode].internal;
  }

  return null;
}

/**
 * Map heating codes to Danish description
 */
export function mapHeatingTypeDanish(
  installationCode: string | undefined,
  fuelCode: string | undefined
): string | null {
  const parts: string[] = [];

  if (installationCode && HEATING_INSTALLATION_CODES[installationCode]) {
    parts.push(HEATING_INSTALLATION_CODES[installationCode].danish);
  }

  if (fuelCode && HEATING_FUEL_CODES[fuelCode]) {
    parts.push(`(${HEATING_FUEL_CODES[fuelCode].danish})`);
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

/**
 * Map roof material code to Danish description
 */
export function mapRoofMaterial(code: string | undefined): string | null {
  if (!code) return null;
  return ROOF_MATERIAL_CODES[code] ?? null;
}

/**
 * Map wall material code to Danish description
 */
export function mapWallMaterial(code: string | undefined): string | null {
  if (!code) return null;
  return WALL_MATERIAL_CODES[code] ?? null;
}

/**
 * Map water supply code to Danish description
 */
export function mapWaterSupply(code: string | undefined): string | null {
  if (!code) return null;
  return WATER_SUPPLY_CODES[code] ?? null;
}

/**
 * Map drainage code to Danish description
 */
export function mapDrainage(code: string | undefined): string | null {
  if (!code) return null;
  return DRAINAGE_CODES[code] ?? null;
}

/**
 * Map contamination code
 */
export function mapContamination(code: string | undefined): string | null {
  if (!code) return null;
  return CONTAMINATION_CODES[code] ?? null;
}

/**
 * Map full BBR property data to our internal format
 */
export function mapBBRToProperty(data: BBRPropertyData): BBRMappedData {
  const { bygning, grund, enheder, ejendomsrelation } = data;

  // Calculate total areas from units if building data is incomplete
  let totalLivingArea = bygning?.byg039BygningensSamledeBoreAreal ?? 0;
  let totalCommercialArea = bygning?.byg040BygningensSamledeErhsomvsareal ?? 0;

  if ((!totalLivingArea || !totalCommercialArea) && enheder.length > 0) {
    for (const enhed of enheder) {
      if (enhed.enh027ArealTilBeboelse) {
        totalLivingArea += enhed.enh027ArealTilBeboelse;
      }
      if (enhed.enh028ArealTilErhverv) {
        totalCommercialArea += enhed.enh028ArealTilErhverv;
      }
    }
  }

  return {
    // Location/identification
    municipalityCode: bygning?.kommunekode ?? grund?.kommunekode ?? null,
    cadastralNumber: grund?.gru009Matrikelnummer ?? null,
    cadastralDistrict: grund?.gru010Ejerlav ?? null,
    bfeNumber: ejendomsrelation?.bfeNummer ?? null,

    // Building characteristics
    buildingYear: bygning?.byg026Opførelsesår ?? null,
    grossAreaM2: bygning?.byg038SamletBygningsareal ?? null,
    livingAreaM2: totalLivingArea || null,
    commercialAreaM2: totalCommercialArea || null,
    numberOfFloors: bygning?.byg054AntalEtager ?? null,

    // Usage
    primaryUse: mapBuildingUsage(bygning?.byg021BygningensAnvendelse),
    primaryUseCode: bygning?.byg021BygningensAnvendelse ?? null,

    // Heating
    heatingType: mapHeatingType(
      bygning?.byg056Varmeinstallation,
      bygning?.byg057Opvarmningsmiddel
    ),
    heatingTypeCode: bygning?.byg056Varmeinstallation ?? null,

    // Materials
    roofMaterial: mapRoofMaterial(bygning?.byg033Tagdækningsmateriale),
    wallMaterial: mapWallMaterial(bygning?.byg035YdervæsMateriale),

    // Infrastructure
    waterSupply: mapWaterSupply(grund?.gru020Vandforsyning),
    drainage: mapDrainage(grund?.gru021Afløbsforhold),

    // Contamination
    contaminationCode: grund?.gru500Forurening ?? null,

    // Raw data for reference
    raw: data,
  };
}

/**
 * Compare BBR data with existing property data and identify discrepancies
 */
export interface BBRDiscrepancy {
  field: string;
  bbrValue: string | number | null;
  existingValue: string | number | null;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export function compareWithExistingData(
  bbrData: BBRMappedData,
  existingData: {
    municipalityCode?: string | null;
    cadastralNumber?: string | null;
    buildingYear?: number | null;
    grossAreaM2?: number | null;
    primaryUse?: string | null;
    heatingType?: string | null;
  }
): BBRDiscrepancy[] {
  const discrepancies: BBRDiscrepancy[] = [];

  // Building year
  if (bbrData.buildingYear && existingData.buildingYear) {
    if (bbrData.buildingYear !== existingData.buildingYear) {
      discrepancies.push({
        field: 'buildingYear',
        bbrValue: bbrData.buildingYear,
        existingValue: existingData.buildingYear,
        severity: 'warning',
        message: `Opførelsesår afviger: BBR siger ${bbrData.buildingYear}, dokument siger ${existingData.buildingYear}`,
      });
    }
  }

  // Gross area - allow 5% tolerance
  if (bbrData.grossAreaM2 && existingData.grossAreaM2) {
    const difference = Math.abs(bbrData.grossAreaM2 - existingData.grossAreaM2);
    const percentDiff = (difference / bbrData.grossAreaM2) * 100;

    if (percentDiff > 5) {
      const severity = percentDiff > 20 ? 'error' : 'warning';
      discrepancies.push({
        field: 'grossAreaM2',
        bbrValue: bbrData.grossAreaM2,
        existingValue: existingData.grossAreaM2,
        severity,
        message: `Areal afviger med ${percentDiff.toFixed(1)}%: BBR siger ${bbrData.grossAreaM2} m², dokument siger ${existingData.grossAreaM2} m²`,
      });
    }
  }

  // Primary use
  if (bbrData.primaryUse && existingData.primaryUse) {
    if (bbrData.primaryUse !== existingData.primaryUse) {
      discrepancies.push({
        field: 'primaryUse',
        bbrValue: bbrData.primaryUse,
        existingValue: existingData.primaryUse,
        severity: 'warning',
        message: `Anvendelse afviger: BBR siger ${bbrData.primaryUse}, dokument siger ${existingData.primaryUse}`,
      });
    }
  }

  // Heating type
  if (bbrData.heatingType && existingData.heatingType) {
    if (bbrData.heatingType !== existingData.heatingType) {
      discrepancies.push({
        field: 'heatingType',
        bbrValue: bbrData.heatingType,
        existingValue: existingData.heatingType,
        severity: 'info',
        message: `Varmetype afviger: BBR siger ${bbrData.heatingType}, dokument siger ${existingData.heatingType}`,
      });
    }
  }

  // Cadastral number (should match if both present)
  if (bbrData.cadastralNumber && existingData.cadastralNumber) {
    if (bbrData.cadastralNumber !== existingData.cadastralNumber) {
      discrepancies.push({
        field: 'cadastralNumber',
        bbrValue: bbrData.cadastralNumber,
        existingValue: existingData.cadastralNumber,
        severity: 'error',
        message: `Matrikelnummer afviger: BBR siger ${bbrData.cadastralNumber}, dokument siger ${existingData.cadastralNumber}`,
      });
    }
  }

  return discrepancies;
}
