// Datafordeler BBR API Types
// Based on: https://confluence.sdfi.dk/pages/viewpage.action?pageId=16056582

/**
 * BBR Bygning (Building) response from Datafordeler API
 * Contains building-level data like construction year, area, usage code, heating
 */
export interface BBRBygning {
  // Identifiers
  id_lokalId: string;
  bygningsnummer?: number;
  datafordelerOpdateringstid?: string;
  forretningshændelse?: string;
  forretningsområde?: string;
  forretningsproces?: string;
  registreringFra?: string;
  registreringsaktør?: string;
  status?: string;
  virkningFra?: string;
  virkningsaktør?: string;

  // Building data
  byg007Bygningsnummer?: number;
  byg021BygningensAnvendelse?: string; // Usage code (e.g., "120" = residential)
  byg026Opførelsesår?: number; // Construction year
  byg027OmsomTilbygningsår?: number; // Year of addition
  byg032YdsomMurværkOmkredsen?: number; // Wall perimeter
  byg033Tagdækningsmateriale?: string; // Roof material code
  byg034YdervsomBeklædning?: string; // Exterior cladding code
  byg035YdervæsMateriale?: string; // Wall material code
  byg037KildeTilBygningensMaterialer?: string;
  byg038SamletBygningsareal?: number; // Total building area (m²)
  byg039BygningensSamledeBoreAreal?: number; // Living area
  byg040BygningensSamledeErhsomvsareal?: number; // Commercial area
  byg041BebyggetAreal?: number; // Built-up area
  byg042ArealIndbygsomretGarage?: number; // Built-in garage area
  byg043ArealIndbygsomretCarport?: number; // Built-in carport area
  byg044ArealIndbygsomretUdhus?: number; // Built-in shed area
  byg045ArealIndbygsomretUdestue?: number; // Built-in conservatory area
  byg046SamletArealAfLukkededsomBygsomTilBygsomsom?: number;
  byg047ArealAfAffaldsrum?: number; // Waste room area
  byg048AndsomArealTilBygsomsom?: number;
  byg049ArealAfOverdækketAreal?: number; // Covered area
  byg050ArealÅbneOverdækkedeTerrasser?: number;
  byg051AdgangsarealTilEnheder?: number; // Access area to units
  byg052Kæsomderareal?: number; // Basement area
  byg053BygAfÅbneAltanerBalksomersomTerrassser?: number;
  byg054AntalEtager?: number; // Number of floors
  byg055AfvhosomvandetArealTilAndenAnvendelse?: number;
  byg056Varmeinstallation?: string; // Heating installation code
  byg057Opvarmningsmiddel?: string; // Heating fuel code
  byg058SupplerendeVarme?: string; // Supplementary heating code
  byg069Sikringsrumpladser?: number;
  byg070Fredning?: string; // Heritage protection code
  byg071BevaringsværdighsomOmfattet?: boolean;
  byg094Revisionsdato?: string;
  byg111StormrådetGenoppsomningsMuligEfterSkadeOversvømmelse?: boolean;
  byg112StormrådetGenoppsingMuligEfterSkadeStormfald?: boolean;
  byg130ArealAfUdvendigEftersolning?: number;
  byg131DispensationFritagelseIftKollBesksomtteVedLigestilsom?: string;
  byg132FritlagtAreal?: number;
  byg133KildeTilKoordinatsæt?: string;
  byg134KvalitetAfKoordinatsæt?: string;
  byg135Koordinatsystem?: string;
  byg136PlaceringPåSøterritorie?: string;
  byg137BanedanmarkBygworksomCertpsomIngOmråde?: boolean;
  byg140ServituterTinglystePåBygningen?: string;
  byg150Gulvbelægning?: string;
  byg151Tagbelægning?: string;
  byg152Tagetagsomstruktion?: string;
  byg301TypeAfFlytning?: string;
  byg302TilsomladsTilFlytning?: string;
  byg403HarBygsomDansomFællesrum?: boolean;
  byg404Koordinat?: string; // Coordinate string (GeoJSON)
  byg406Koordinatsystem?: string;

  // Relations
  grund?: string; // Reference to Grund (plot)
  husnummer?: string; // Reference to address
  jordstykke?: string[];

  // Foreign keys
  kommunekode?: string; // Municipality code
  ejerlejlighed?: string[];
}

/**
 * BBR Enhed (Unit) response from Datafordeler API
 * Contains unit-level data within a building
 */
export interface BBREnhed {
  // Identifiers
  id_lokalId: string;
  datafordelerOpdateringstid?: string;
  forretningshændelse?: string;
  forretningsområde?: string;
  forretningsproces?: string;
  registreringFra?: string;
  registreringsaktør?: string;
  status?: string;
  virkningFra?: string;
  virkningsaktør?: string;

  // Unit data
  enh020EnhedsAnvendelse?: string; // Unit usage code
  enh023Boligtype?: string; // Housing type
  enh024KondemneretBoligenhed?: boolean;
  enh025OprettelsesdatoForEnhedensBeboelsesret?: string;
  enh026OprettelsesdatoForEnhedensBrugsret?: string;
  enh027ArealTilBeboelse?: number; // Living area (m²)
  enh028ArealTilErhverv?: number; // Commercial area (m²)
  enh030KildeTilEnhedensArealer?: string;
  enh031AnvendelseFridsomageOffentligStøtte?: string;
  enh032IndflytningDato?: string;
  enh034RefusionBeløbFridsomageOffentligStøtte?: number;
  enh035OprindelseskodenForBoligellErhvsenhed?: string;
  enh039AndetAreal?: number; // Other area
  enh041LovligAnvendelse?: string;
  enh042RumHøjde?: number; // Room height
  enh044Etage?: string; // Floor level
  enh045Placering?: string; // Position (left/right/middle)
  enh046OffentligStøtte?: string;
  enh047IndflytningDato?: string;
  enh048GodkendtTomBolig?: boolean;
  enh060EnhedensAndsomOmsomBeboereAntal?: number;
  enh063AntalsomAfBadeværelser?: number; // Number of bathrooms
  enh065AntalsomAfToiletter?: number; // Number of toilets
  enh066AntalsomAfVærelser?: number; // Number of rooms
  enh067Bruttoetageareal?: number; // Gross floor area
  enh068Nettoetageareal?: number; // Net floor area
  enh069Beboelsesareal?: number; // Residential area
  enh070Erhvervsareal?: number; // Commercial area
  enh071ArealAfÅbneOverdækkedeTerrasser?: number;
  enh072ArealAfLukkedeOverdækkedeTerasser?: number;
  enh076OverskredetArealOver5pct?: boolean;
  enh101Gyldighedsdato?: string;

  // Relations
  bygning?: string; // Reference to Bygning
  adresse?: string; // Reference to address
  adgangsadresse?: string;
  opgangBygning?: string;
}

/**
 * BBR Grund (Plot) response from Datafordeler API
 * Contains plot-level data including cadastral information
 */
export interface BBRGrund {
  // Identifiers
  id_lokalId: string;
  datafordelerOpdateringstid?: string;
  forretningshændelse?: string;
  forretningsområde?: string;
  forretningsproces?: string;
  registreringFra?: string;
  registreringsaktør?: string;
  status?: string;
  virkningFra?: string;
  virkningsaktør?: string;

  // Plot data
  gru009Matrikelnummer?: string; // Cadastral number
  gru010Ejerlav?: string; // Cadastral district
  gru014Ejerlavskode?: number; // Cadastral district code
  gru020Vandforsyning?: string; // Water supply code
  gru021Afløbsforhold?: string; // Drainage code
  gru022MedlIndsomGrundejersomForening?: boolean;
  gru024Udlersomjningskode?: string;
  gru500Forurening?: string; // Contamination code

  // Relations
  kommunekode?: string; // Municipality code
  husnummer?: string; // Reference to address
  jordstykke?: string[];
  bygningPåFremmedGrund?: string[];
}

/**
 * BBR Ejendomsrelation response from Datafordeler API
 * Links buildings, units, and plots to a property
 */
export interface BBREjendomsrelation {
  id_lokalId: string;
  bfeNummer?: number; // Property ID number (BFE)
  ejerlejlighedsNummer?: number;
  ejendomstype?: string;
  kommunekode?: string;

  // Relations
  bygning?: string[];
  enhed?: string[];
  grund?: string[];
}

/**
 * Wrapper for paginated API responses
 */
export interface BBRApiResponse<T> {
  type?: string;
  features?: Array<{
    type: string;
    properties: T;
    geometry?: {
      type: string;
      coordinates: number[];
    };
  }>;
  // Direct array response format
  [index: number]: T;
}

/**
 * Search parameters for BBR API
 */
export interface BBRSearchParams {
  // Address-based search
  adresse?: string;
  postnummer?: string; // Postal code
  vejnavn?: string; // Street name
  husnummer?: string; // House number

  // Cadastral-based search
  kommunekode?: string; // Municipality code (4 digits)
  matrikelnummer?: string; // Cadastral number
  ejerlavskode?: number; // Cadastral district code

  // ID-based search
  id?: string;
  bygningsnummer?: number;

  // Pagination
  pagesize?: number;
  page?: number;
}

/**
 * Combined property data from BBR lookup
 */
export interface BBRPropertyData {
  bygning: BBRBygning | null;
  enheder: BBREnhed[];
  grund: BBRGrund | null;
  ejendomsrelation: BBREjendomsrelation | null;

  // Metadata
  fetchedAt: Date;
  source: 'datafordeler';
}

/**
 * Mapped BBR data to our internal DiligenceProperty format
 */
export interface BBRMappedData {
  municipalityCode: string | null;
  cadastralNumber: string | null;
  cadastralDistrict: string | null;
  buildingYear: number | null;
  grossAreaM2: number | null;
  livingAreaM2: number | null;
  commercialAreaM2: number | null;
  numberOfFloors: number | null;
  primaryUse: string | null;
  primaryUseCode: string | null;
  heatingType: string | null;
  heatingTypeCode: string | null;
  roofMaterial: string | null;
  wallMaterial: string | null;
  waterSupply: string | null;
  drainage: string | null;
  contaminationCode: string | null;
  bfeNumber: number | null;

  // Raw data for reference
  raw: BBRPropertyData;
}
