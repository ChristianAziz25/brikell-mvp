# Prisma Setup Steps for Supabase

## Overview
This document outlines the complete Prisma setup process for connecting to Supabase and handling rent roll data imports.

## Prerequisites
- Supabase project created
- Database URL from Supabase
- Node.js 18+ installed

## Step-by-Step Setup

### Step 1: Install Dependencies ✅
Already completed:
```bash
npm install prisma @prisma/client papaparse
npm install -D @types/papaparse
```

### Step 2: Configure Environment Variables

Create/update `.env.local` in the project root:

```env
# Supabase Database Connection
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require"

# OpenAI (for future semantic extraction)
OPENAI_API_KEY=your_key_here_when_available
```

**To get your Supabase connection string:**
1. Go to Supabase Dashboard → Your Project
2. Settings → Database
3. Copy "Connection string" under "Connection parameters"
4. Replace `[YOUR-PASSWORD]` with your database password

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

This creates the Prisma Client TypeScript types based on your schema.

### Step 4: Create Initial Migration

```bash
npx prisma migrate dev --name init_rent_roll
```

This will:
- Create migration files in `prisma/migrations/`
- Apply the schema to your Supabase database
- Create the `rent_roll_units` table

### Step 5: Verify Setup

**Option A: Using Prisma Studio**
```bash
npx prisma studio
```
Opens visual database browser at `http://localhost:5555`

**Option B: Check Supabase Dashboard**
- Go to Table Editor
- Verify `rent_roll_units` table exists with all columns

## File Structure Created

```
prisma/
  schema.prisma          # Database schema definition
  migrations/            # Migration files (created after migrate)

src/
  lib/
    prisma/
      client.ts          # Prisma client singleton
      types.ts           # TypeScript types
      rent-roll.ts       # Database operations
      index.ts           # Exports
    file-parser/
      types.ts           # Parser types
      parser.ts          # CSV parsing logic
  app/
    api/
      upload/
        route.ts         # File upload API endpoint
```

## Database Schema

The `RentRollUnit` model includes:

### Core Fields
- `id` - Unique identifier (CUID)
- `unitId` - Unit identifier (unique, indexed)
- `propertyYear`, `propertyName`, `unitAddress`, etc. - All standard rent roll fields

### Special Fields
- `extraData` - JSONB field for additional CSV columns not in the schema
- `status` - Enum: `occupied`, `vacant`, `terminated`
- `createdAt`, `updatedAt` - Automatic timestamps

### Indexes
- `propertyName` - For filtering by property
- `status` - For filtering by occupancy status
- `unitId` - For fast lookups

## API Usage

### Upload Endpoint: `POST /api/upload`

**Request:**
```typescript
const formData = new FormData();
formData.append('file', file); // CSV file
formData.append('columnMapping', JSON.stringify(mapping)); // Optional

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully processed 10 units",
  "inserted": 8,
  "updated": 2,
  "errors": [],
  "metadata": {
    "fileName": "rent_roll.csv",
    "fileType": "csv",
    "rowCount": 10,
    "columnCount": 17
  }
}
```

## Column Mapping

The system uses flexible column mapping to handle different CSV formats:

```typescript
const columnMapping = {
  'Unit ID': 'Unit ID',           // Maps CSV "Unit ID" to DB unitId
  'Property Year': 'Property Year',
  // ... etc
};
```

**Default mapping** handles common variations:
- `Unit ID`, `unit_id`, `unit id` → all map to `unitId`
- Case-insensitive matching
- Handles spaces, underscores, and special characters

## Data Flow

1. **File Upload** → User selects CSV/XLSX file
2. **File Parsing** → `parseCSV()` extracts headers and rows
3. **Column Mapping** → Maps CSV columns to database columns
4. **Data Transformation** → Converts CSV rows to `RentRollUnitInput`
5. **Bulk Upsert** → Inserts new records or updates existing ones
6. **Response** → Returns success/error with statistics

## Next Steps (When OpenAI API Key Available)

1. **Semantic Column Detection**
   - Use OpenAI to analyze CSV headers
   - Automatically generate column mapping
   - Handle variations in column names

2. **Enhanced File Support**
   - Add XLSX/XLS parsing (using `xlsx` library)
   - Add PDF text extraction (using `pdf-parse`)

3. **Data Validation**
   - Add Zod schemas for validation
   - Better error messages for invalid data

4. **Batch Processing**
   - Handle large files in chunks
   - Progress tracking for uploads

## Troubleshooting

### "Can't reach database server"
- Check `DATABASE_URL` is correct
- Verify Supabase project is active
- Ensure SSL mode is `require`

### "Table does not exist"
- Run `npx prisma migrate dev` to apply migrations
- Check migration files in `prisma/migrations/`

### Type Errors
- Run `npx prisma generate` after schema changes
- Restart TypeScript server in IDE

### Connection Pool Errors
- Add connection pooling to `DATABASE_URL`:
  ```
  ?pgbouncer=true&connection_limit=1
  ```

## Useful Commands

```bash
# Generate Prisma Client
npm run db:generate

# Create and apply migration
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Push schema without migration (dev only)
npm run db:push

# Pull schema from database
npm run db:pull
```

