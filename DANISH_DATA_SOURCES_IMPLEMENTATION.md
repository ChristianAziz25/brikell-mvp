# Danish Public Data Sources Integration

## Overview

This implementation adds support for connecting to Danish public data sources (BBR, OIS, EJF) and using them to detect anomalies, discrepancies, and flag risks when parsing PDFs in the diligence section.

## What's Been Implemented

### 1. Database Schema ✅
- **BBRData**: Building and Housing Register data
- **OISData**: Public Information Server data  
- **EJFData**: Property Valuation and Income Tax Administration data
- **DocumentAnalysis**: Stores PDF analysis results
- **Anomaly**: Individual anomaly records

### 2. Anomaly Detection System ✅
- Cross-references PDF extracted data with public databases
- Detects:
  - Value mismatches (property values, taxes)
  - Date discrepancies (building years)
  - Area measurement differences
  - Missing registrations
- Calculates risk flags based on anomaly severity

### 3. Data Sync API Endpoints ✅
- `/api/data-sources/bbr` - Sync BBR data
- `/api/data-sources/ois` - Sync OIS data
- `/api/data-sources/ejf` - Sync EJF data

**Note**: These are placeholder implementations. You'll need to:
1. Get API credentials from the respective services
2. Implement actual API calls
3. Handle authentication and rate limiting

### 4. Enhanced PDF Parser ✅
- Automatically runs anomaly detection after PDF extraction
- Stores analysis results in database
- Includes anomalies in chat response

### 5. UI Components ✅
- `AnomalyAlerts` component for displaying anomalies
- Integrated into chat interface

## Next Steps

### 1. Run Database Migration
```bash
npx prisma migrate dev --name add_danish_data_sources
npx prisma generate
```

### 2. Get API Credentials

#### BBR (Building and Housing Register)
- Register at: https://datafordeler.dk/
- Get API key for BBR service
- Add to `.env.local`:
  ```
  BBR_API_KEY=your_api_key_here
  ```

#### OIS (Public Information Server)
- Contact OIS for API access
- Add to `.env.local`:
  ```
  OIS_API_KEY=your_api_key_here
  ```

#### EJF (Property Valuation)
- Contact SKAT for API access
- Add to `.env.local`:
  ```
  EJF_API_KEY=your_api_key_here
  ```

### 3. Implement Actual API Calls

Update the following files with real API implementations:
- `src/app/api/data-sources/bbr/route.ts`
- `src/app/api/data-sources/ois/route.ts`
- `src/app/api/data-sources/ejf/route.ts`

### 4. Test the System

1. Upload a PDF in the diligence section
2. The system will:
   - Extract data from PDF
   - Cross-reference with public databases
   - Detect anomalies
   - Display risk flags and anomalies in chat

## Usage

### Syncing Data for a Property

```typescript
// Sync BBR data
await fetch('/api/data-sources/bbr', {
  method: 'POST',
  body: JSON.stringify({
    address: 'Slotsgade 23',
    zipCode: '8700',
    bbrNumber: 'optional-bbr-number'
  })
});

// Sync OIS data
await fetch('/api/data-sources/ois', {
  method: 'POST',
  body: JSON.stringify({
    address: 'Slotsgade 23',
    zipCode: '8700'
  })
});

// Sync EJF data
await fetch('/api/data-sources/ejf', {
  method: 'POST',
  body: JSON.stringify({
    address: 'Slotsgade 23',
    zipCode: '8700',
    year: 2025
  })
});
```

### Viewing Anomalies

Anomalies are automatically detected when parsing PDFs. They appear in the chat response after the extracted content.

## Anomaly Types

- **value_mismatch**: Property values differ significantly from public records
- **date_mismatch**: Building years don't match
- **discrepancy**: Area measurements or other metrics differ
- **missing_data**: Property not found in public databases

## Risk Flag Levels

- **critical**: Multiple high-severity issues
- **high**: Significant value inconsistencies
- **medium**: Missing registrations or moderate discrepancies
- **low**: Minor issues or missing optional data

## Database Models

All models are in `prisma/schema.prisma`:
- `BBRData` - Links to `Asset` via `propertyId`
- `OISData` - Links to `Asset` via `propertyId`
- `EJFData` - Links to `Asset` via `propertyId` (unique on address+zip+year)
- `DocumentAnalysis` - Stores PDF analysis with anomalies
- `Anomaly` - Individual anomaly records linked to `DocumentAnalysis`
