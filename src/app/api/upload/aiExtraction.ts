import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const LLMExtractedRowSchema = z.object({
  // Primary identifiers
  unit_id: z.number().optional(),
  assetId: z.string().optional(),

  // Property & unit basics (Prisma field names)
  property_build_year: z.number().optional(),
  property_name: z.string().optional(),
  unit_address: z.string().optional(),
  unit_zipcode: z.string().optional(),
  unit_door: z.number().optional(),
  unit_floor: z.number().optional(),

  // Numbers that will be parsed before writing to Prisma
  utilites_cost: z.number().optional(),
  unit_type: z.string().optional(),
  size_sqm: z.number().optional(),
  rooms_amount: z.number().optional(),
  bedrooms_amount: z.number().optional(),
  bathrooms_amount: z.number().optional(),
  rent_current_gri: z.number().optional(),
  rent_budget_tri: z.number().optional(),

  // Status & lease info
  units_status: z.enum(['occupied', 'vacant', 'terminated']).optional(),
  // Dates must be JSON-serializable for the LLM schema, so use ISO date-time strings
  lease_start: z.string().datetime().optional(),
  lease_end: z.string().datetime().optional(),

  // Tenant contact info (only first tenant for now)
  tenant_name1: z.string().optional(),
  tenant_number1: z.number().optional(),
  tenant_email1: z.string().optional(),
  tenant_name2: z.string().optional(),
  tenant_number2: z.number().optional(),
  tenant_email2: z.string().optional(),
});

const LLMExtractionSchema = z.object({
  rows: z.array(LLMExtractedRowSchema),
});

export type LLMExtractedRow = z.infer<typeof LLMExtractedRowSchema>;

export async function extractDataWithLLM(
  fileContent: string,
  fileType: 'csv' | 'xlsx' | 'xls'
): Promise<LLMExtractedRow[]> {
  const systemPrompt = `You are a data extraction expert. Extract rent roll data from the provided ${fileType.toUpperCase()} content.

Extract all rows/units and return them as an array. Each row must use these EXACT field names (snake_case). They should map 1:1 to the Prisma RentRollUnitCreateInput fields (excluding system-managed fields like created_at, updated_at, and asset):
- unit_id (number, required if available)
- assetId (string, optional)
- property_build_year (number, optional; will be parsed into a number)
- property_name (string, optional)
- unit_address (string, optional)
- unit_zipcode (string, optional)
- unit_door (number, optional)
- unit_floor (number, optional)
- utilites_cost (number, number as text, optional)
- unit_type (string, optional)
- size_sqm (number, optional)
- rooms_amount (number as text, optional)
- bedrooms_amount (number as text, optional)
- bathrooms_amount (number as text, optional)
- rent_current_gri (number as text, optional)
- rent_budget_tri (number as text, optional)
- units_status (enum: 'occupied' | 'vacant' | 'terminated', optional)
- lease_start (string, ISO date format, optional)
- lease_end (string, ISO date format, optional)
- tenant_name1 (string, optional)
- tenant_name2 (string, optional)
- tenant_number1 (number, optional)
- tenant_number2 (number, optional)
- tenant_email1 (string, optional)
- tenant_email2 (string, optional)

IMPORTANT: Use the exact field names above.
If a field is missing or unclear, omit it (don't use null).`;

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: LLMExtractionSchema,
    prompt: `Extract all rent roll data from this ${fileType}:\n\n${fileContent.substring(0, 20000)}`,
    system: systemPrompt,
  });

  return object.rows;
}