# Prisma Setup Guide for Supabase

This guide walks you through setting up Prisma with Supabase for the rent roll data import system.

## Step 1: Install Dependencies

Dependencies are already installed:
- `prisma` - Prisma CLI
- `@prisma/client` - Prisma Client
- `papaparse` - CSV parsing library

## Step 2: Configure Supabase Connection

1. Get your Supabase connection string:
   - Go to your Supabase project dashboard
   - Navigate to Settings > Database
   - Copy the "Connection string" (URI format)
   - It should look like: `postgresql://user:password@host:port/database?sslmode=require`

2. Create/update `.env.local` file in the project root:

```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

**Important**: Replace the connection string with your actual Supabase credentials.

## Step 3: Generate Prisma Client

Run the following command to generate the Prisma Client:

```bash
npx prisma generate
```

This creates the Prisma Client based on your schema.

## Step 4: Create Database Migration

Create and apply the initial migration:

```bash
npx prisma migrate dev --name init_rent_roll
```

This will:
- Create a migration file in `prisma/migrations/`
- Apply the migration to your Supabase database
- Create the `rent_roll_units` table with all columns

## Step 5: Verify the Setup

You can verify the setup by:

1. **Viewing your database in Supabase Dashboard**:
   - Go to Table Editor
   - You should see the `rent_roll_units` table

2. **Or using Prisma Studio**:
   ```bash
   npx prisma studio
   ```
   This opens a visual database browser at `http://localhost:5555`

## Step 6: Update Package.json Scripts (Optional)

Add these helpful scripts to `package.json`:

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:push": "prisma db push",
    "db:pull": "prisma db pull"
  }
}
```

## Database Schema

The `RentRollUnit` model includes:

- **Primary Fields**: All standard rent roll columns (unitId, propertyYear, propertyName, etc.)
- **Status Enum**: `occupied`, `vacant`, `terminated`
- **Extra Data**: JSONB field for any additional columns from CSV files
- **Timestamps**: `createdAt` and `updatedAt` for tracking
- **Indexes**: On `propertyName`, `status`, and `unitId` for faster queries

## File Upload Flow

1. **User uploads CSV/XLSX file** via the upload dialog
2. **File is parsed** using `papaparse` (CSV) or future XLSX parser
3. **Column mapping** maps CSV headers to database columns
4. **Data transformation** converts CSV rows to `RentRollUnitInput` format
5. **Bulk upsert** inserts/updates data in Supabase using Prisma
6. **Response** returns success/error with statistics

## API Endpoint

The upload endpoint is available at: `POST /api/upload`

**Request**:
- `file`: File object (CSV/XLSX)
- `columnMapping` (optional): JSON mapping of CSV columns to DB columns

**Response**:
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

## Next Steps (When OpenAI API Key is Available)

1. **Semantic Column Detection**: Use OpenAI to automatically detect and map CSV columns
2. **PDF/XLSX Parsing**: Add support for PDF and Excel file parsing
3. **Data Validation**: Add more robust validation using Zod schemas
4. **Error Handling**: Improve error messages and retry logic

## Troubleshooting

### Connection Issues
- Verify your `DATABASE_URL` is correct
- Check that your Supabase project is active
- Ensure SSL mode is set to `require` in the connection string

### Migration Issues
- Run `npx prisma migrate reset` to reset (WARNING: deletes all data)
- Check migration files in `prisma/migrations/` for errors

### Type Errors
- Run `npx prisma generate` after schema changes
- Restart your TypeScript server in your IDE

