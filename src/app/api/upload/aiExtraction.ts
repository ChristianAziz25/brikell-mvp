import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const LLMExtractedRowSchema = z.object({
  // Primary identifiers
  unit_id: z.string().optional(),
  assetId: z.string().optional(),

  // Property & unit basics (Prisma field names)
  property_build_year: z.string().optional(),
  property_name: z.string().optional(),
  unit_address: z.string().optional(),
  unit_zipcode: z.string().optional(),
  unit_door: z.string().optional(),
  unit_floor: z.string().optional(),

  // Numbers that will be parsed before writing to Prisma
  utilites_cost: z.string().optional(),
  unit_type: z.string().optional(),
  size_sqm: z.string().optional(),
  rooms_amount: z.string().optional(),
  bedrooms_amount: z.string().optional(),
  bathrooms_amount: z.string().optional(),
  rent_current_gri: z.string().optional(),
  rent_budget_tri: z.string().optional(),

  // Status & lease info
  units_status: z.enum(['occupied', 'vacant', 'terminated']).optional(),
  lease_start: z.string().optional(),
  lease_end: z.string().optional(),

  // Tenant contact info (only first tenant for now)
  tenant_name1: z.string().optional(),
  tenant_number1: z.string().optional(),
  tenant_email1: z.string().optional(),
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

Extract all rows/units and return them as an array. Each row must use these EXACT field names (snake_case), which directly match the Prisma RentRollUnit model:
- unit_id (string, required if available)
- assetId (string, optional)
- property_build_year (string, year as text, optional)
- property_name (string, optional)
- unit_address (string, optional)
- unit_zipcode (string, optional)
- unit_door (string, optional)
- unit_floor (string, optional)
- utilites_cost (string, number as text, optional)
- unit_type (string, optional)
- size_sqm (string, number as text, optional)
- rooms_amount (string, number as text, optional)
- bedrooms_amount (string, number as text, optional)
- bathrooms_amount (string, number as text, optional)
- rent_current_gri (string, number as text, optional)
- rent_budget_tri (string, number as text, optional)
- units_status (enum: 'occupied' | 'vacant' | 'terminated', optional)
- lease_start (string, ISO date format, optional)
- lease_end (string, ISO date format, optional)
- tenant_name1 (string, optional)
- tenant_number1 (string, optional)
- tenant_email1 (string, optional)

IMPORTANT: Use the exact field names above.
If a field is missing or unclear, omit it (don't use null).`;

  const { object } = await generateObject({
    model: openai('gpt-5-nano'),
    schema: LLMExtractionSchema,
    prompt: `Extract all rent roll data from this ${fileType}:\n\n${fileContent.substring(0, 10000)}`,
    system: systemPrompt,
    temperature: 0.1,
  });

  return object.rows;
}