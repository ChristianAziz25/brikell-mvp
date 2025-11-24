import { NextRequest, NextResponse } from 'next/server';
import { parseCSV, mapRowsToRentRollUnits } from '@/lib/file-parser/parser';
import { bulkUpsertRentRollUnits } from '@/lib/prisma/rent-roll';
import type { RentRollColumnMapping } from '@/lib/file-parser/types';

const DEFAULT_COLUMN_MAPPING: RentRollColumnMapping = {
  'Unit ID': 'Unit ID',
  'Property Name': 'Property Name',
  'Address': 'Address',
  'Zipcode': 'Zipcode',
  'Size': 'Size',
  'Rooms': 'Rooms',
  'Bedrooms': 'Bedrooms',
  'Bathrooms': 'Bathrooms',
  'Floor': 'Floor',
  'Monthly Rent': 'Monthly Rent',
  'Contracted Rent': 'Contracted Rent',
  'Status': 'Status',
  'Lease Start': 'Lease Start',
  'Lease End': 'Lease End',
  'Tenant Name': 'Tenant Name',
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const columnMappingJson = formData.get('columnMapping') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload CSV, XLSX, or XLS files.' },
        { status: 400 }
      );
    }

    let parsedData;
    let columnMapping: RentRollColumnMapping = DEFAULT_COLUMN_MAPPING;

    if (columnMappingJson) {
      try {
        columnMapping = JSON.parse(columnMappingJson);
      } catch {
        return NextResponse.json(
          { error: 'Invalid column mapping JSON' },
          { status: 400 }
        );
      }
    }

    if (file.name.endsWith('.csv')) {
      parsedData = await parseCSV(file);
    } else {
      return NextResponse.json(
        { error: 'XLSX/XLS parsing not yet implemented. Please use CSV for now.' },
        { status: 400 }
      );
    }

    const rentRollUnits = mapRowsToRentRollUnits(parsedData.rows, columnMapping);

    if (rentRollUnits.length === 0) {
      return NextResponse.json(
        { error: 'No valid data found in file' },
        { status: 400 }
      );
    }

    const result = await bulkUpsertRentRollUnits(rentRollUnits);

    return NextResponse.json({
      success: result.success,
      message: `Successfully processed ${rentRollUnits.length} units`,
      inserted: result.inserted,
      updated: result.updated,
      errors: result.errors,
      metadata: parsedData.metadata,
    });
  } catch (error: unknown) {
    console.error('Upload error:', error);
    const errorObj = error as { message?: string };
    return NextResponse.json(
      {
        error: errorObj?.message || 'Failed to process file upload',
      },
      { status: 500 }
    );
  }
}
