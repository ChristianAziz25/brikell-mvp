import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const LLMExtractedRowSchema = z.object({
  unit_id: z.string().optional(),
  property: z.string().optional(),
  address: z.string().optional(),
  zipcode: z.string().optional(),
  size: z.string().optional(),
  rooms: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  floor: z.string().optional(),
  monthly_rent: z.string().optional(),
  contracted_rent: z.string().optional(),
  occupancy_status: z.enum(['occupied', 'vacant', 'terminated']).optional(),
  lease_start: z.string().optional(),
  lease_end: z.string().optional(),
  tenant_name: z.string().optional(),
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

Extract all rows/units and return them as an array. Each row must use these EXACT field names (snake_case):
- unit_id (string, required if available)
- property (string, optional)
- address (string, optional)
- zipcode (string, optional)
- size (string, optional)
- rooms (string, optional)
- bedrooms (string, optional)
- bathrooms (string, optional)
- floor (string, optional)
- monthly_rent (string, optional)
- contracted_rent (string, optional)
- occupancy_status (enum: 'occupied' | 'vacant' | 'terminated', optional)
- lease_start (string, ISO date format, optional)
- lease_end (string, ISO date format, optional)
- tenant_name (string, optional)

IMPORTANT: Use the exact field names above. For status, use 'occupancy_status' not 'status'.
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