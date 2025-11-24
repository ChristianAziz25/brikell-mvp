import type { RentRollUnit, OccupancyStatus } from '@prisma/client';

export type { RentRollUnit, OccupancyStatus };

export interface RentRollUnitInput {
  unitId: string;
  propertyName: string;
  address: string;
  zipcode: string;
  size: string;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  floor: string;
  monthlyRent: number;
  contractedRent: number;
  occupancyStatus: OccupancyStatus;
  leaseStart: Date;
  leaseEnd: Date;
  tenantName: string;
}

export interface BulkInsertResult {
  success: boolean;
  inserted: number;
  updated: number;
  errors: Array<{ unitId: string; error: string }>;
}
