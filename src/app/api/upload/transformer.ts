import { OccupancyStatus } from '@/generated/enums';
import type { RentRollUnitInput } from '@/lib/prisma/types';
import type { LLMExtractedRow } from './aiExtraction';

export function transformLLMDataToRentRollUnit(
  extracted: LLMExtractedRow
): RentRollUnitInput | null {
  if (!extracted.unit_id) {
    return null;
  }

  const parseNumber = (value: string | undefined, defaultValue = 0): number => {
    if (!value) return defaultValue;
    const num = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(num) ? defaultValue : Math.round(num);
  };

  const parseDate = (dateString: string | undefined): Date => {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  const parseStatus = (status: string | undefined): OccupancyStatus => {
    if (!status) return 'vacant';
    const normalized = status.toLowerCase();
    if (normalized === 'occupied' || normalized === 'vacant' || normalized === 'terminated') {
      return normalized as OccupancyStatus;
    }
    return 'vacant';
  };

  // Extract year from property name or use current year as default
  const extractYearFromPropertyName = (name: string): number => {
    const yearMatch = name.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();
  };

  const propertyName = extracted.property || 'Unknown';

  return {
    unitId: extracted.unit_id,
    propertyYear: extractYearFromPropertyName(propertyName),
    propertyName,
    address: extracted.address || '',
    zipcode: extracted.zipcode || '',
    size: extracted.size || '',
    rooms: parseNumber(extracted.rooms, 0),
    bedrooms: parseNumber(extracted.bedrooms, 0),
    bathrooms: parseNumber(extracted.bathrooms, 0),
    floor: extracted.floor || '—',
    monthlyRent: parseNumber(extracted.monthly_rent, 0),
    contractedRent: parseNumber(extracted.contracted_rent, 0),
    occupancyStatus: parseStatus(extracted.occupancy_status),
    leaseStart: parseDate(extracted.lease_start),
    leaseEnd: parseDate(extracted.lease_end),
    tenantName: extracted.tenant_name || '',
  };
}