// Datafordeler Module
// Integration with Danish government property data APIs

// Types
export * from './types';

// Client
export {
  searchBygninger,
  searchEnheder,
  searchGrunde,
  searchEjendomsrelationer,
  getBygningById,
  getEnhedById,
  getGrundById,
  testConnection,
  hasCredentials,
  DatafordelerError,
  type DatafordelerConfig,
} from './client';

// BBR Service
export {
  getBygningByAddress,
  getBygningByCadastral,
  getEnhederByBygning,
  getFullPropertyData,
  getFullPropertyDataByCadastral,
  getPropertyByBygningId,
  BBRServiceError,
  type AddressLookup,
  type CadastralLookup,
} from './bbr-service';

// Mappers
export {
  mapBuildingUsage,
  mapBuildingUsageDanish,
  mapHeatingType,
  mapHeatingTypeDanish,
  mapRoofMaterial,
  mapWallMaterial,
  mapWaterSupply,
  mapDrainage,
  mapContamination,
  mapBBRToProperty,
  compareWithExistingData,
  BUILDING_USAGE_CODES,
  HEATING_INSTALLATION_CODES,
  HEATING_FUEL_CODES,
  ROOF_MATERIAL_CODES,
  WALL_MATERIAL_CODES,
  WATER_SUPPLY_CODES,
  DRAINAGE_CODES,
  CONTAMINATION_CODES,
  type BBRDiscrepancy,
} from './mappers';
