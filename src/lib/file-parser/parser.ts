import Papa from 'papaparse';
import type { ParsedFileData, RentRollColumnMapping } from './types';
import type { RentRollUnitInput } from '../prisma/types';
import { OccupancyStatus } from '@prisma/client';

export async function parseCSV(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
          return;
        }

        const rows = results.data as Record<string, unknown>[];
        const headers = Object.keys(rows[0] || {});

        resolve({
          headers,
          rows,
          metadata: {
            fileName: file.name,
            fileType: 'csv',
            rowCount: rows.length,
            columnCount: headers.length,
          },
        });
      },
      error: (error) => reject(error),
    });
  });
}

export function normalizeColumnName(columnName: string): string {
  return columnName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function parseDate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return new Date();
  }
  return date;
}

export function mapToRentRollUnit(
  row: Record<string, unknown>,
  columnMapping: RentRollColumnMapping
): RentRollUnitInput | null {
  try {
    const getValue = (csvColumn: string | undefined): string => {
      if (!csvColumn) return '';
      const normalized = normalizeColumnName(csvColumn);
      const value = Object.entries(row).find(
        ([key]) => normalizeColumnName(key) === normalized
      )?.[1];
      return value ? String(value).trim() : '';
    };

    const getNumber = (csvColumn: string | undefined, defaultValue = 0): number => {
      const value = getValue(csvColumn);
      const num = parseFloat(value.replace(/[^\d.-]/g, ''));
      return isNaN(num) ? defaultValue : num;
    };

    const getStatus = (csvColumn: string | undefined): OccupancyStatus => {
      const value = getValue(csvColumn).toLowerCase();
      if (value === 'occupied' || value === 'vacant' || value === 'terminated') {
        return value as OccupancyStatus;
      }
      return 'vacant';
    };

    const unitId = getValue(columnMapping['Unit ID'] || columnMapping['unit_id'] || columnMapping['unit id'] || 'unit_id' || 'unit id');
    if (!unitId) {
      return null;
    }

    return {
      unitId,
      propertyName: getValue(columnMapping['Property Name'] || 'property_name' || 'property name') || 'Unknown',
      address: getValue(columnMapping['Address'] || 'address') || '',
      zipcode: getValue(columnMapping['Zipcode'] || 'zipcode') || '',
      size: getValue(columnMapping['Size'] || 'size') || '',
      rooms: getNumber(columnMapping['Rooms'] || 'rooms', 0),
      bedrooms: getNumber(columnMapping['Bedrooms'] || 'bedrooms', 0),
      bathrooms: getNumber(columnMapping['Bathrooms'] || 'bathrooms', 0),
      floor: getValue(columnMapping['Floor'] || 'floor') || '—',
      monthlyRent: getNumber(columnMapping['Monthly Rent'] || 'monthly_rent' || 'monthly rent', 0),
      contractedRent: getNumber(columnMapping['Contracted Rent'] || 'contracted_rent' || 'contracted rent', 0),
      occupancyStatus: getStatus(columnMapping['Status'] || 'status'),
      leaseStart: parseDate(getValue(columnMapping['Lease Start'] || 'lease_start' || 'lease start')),
      leaseEnd: parseDate(getValue(columnMapping['Lease End'] || 'lease_end' || 'lease end')),
      tenantName: getValue(columnMapping['Tenant Name'] || 'tenant_name' || 'tenant name') || '',
    };
  } catch (error) {
    console.error('Error mapping row to RentRollUnit:', error);
    return null;
  }
}

export function mapRowsToRentRollUnits(
  rows: Record<string, unknown>[],
  columnMapping: RentRollColumnMapping
): RentRollUnitInput[] {
  const units: RentRollUnitInput[] = [];

  for (const row of rows) {
    const unit = mapToRentRollUnit(row, columnMapping);
    if (unit) {
      units.push(unit);
    }
  }

  return units;
}
