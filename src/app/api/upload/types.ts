export interface ParsedFileData {
  headers: string[];
  rows: Record<string, unknown>[];
  metadata: {
    fileName: string;
    fileType: 'csv' | 'xlsx' | 'xls' | 'pdf';
    rowCount: number;
    columnCount: number;
  };
}

export interface ColumnMapping {
  csvColumn: string;
  dbColumn: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
}

export interface RentRollColumnMapping {
  'Unit ID'?: string;
  'Property Name'?: string;
  'Address'?: string;
  'Zipcode'?: string;
  'Size'?: string;
  'Rooms'?: string;
  'Bedrooms'?: string;
  'Bathrooms'?: string;
  'Floor'?: string;
  'Monthly Rent'?: string;
  'Contracted Rent'?: string;
  'Status'?: string;
  'Lease Start'?: string;
  'Lease End'?: string;
  'Tenant Name'?: string;
  [key: string]: string | undefined;
}
