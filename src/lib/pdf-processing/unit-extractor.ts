/**
 * LLM-based unit extraction from PDF text
 * Extracts rental unit data for matching against database
 */

import OpenAI from "openai";
import type { ExtractedUnit } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Optimized prompt for unit extraction
const UNIT_EXTRACTION_PROMPT = `You are a document parser specializing in real estate rent rolls and property documents.
Extract all rental units from the provided document text. For each unit, extract:
- unit_address: Full street address
- unit_zipcode: Postal/zip code (4 digits for Danish addresses)
- unit_door: Door/apartment number (as integer)
- unit_floor: Floor number (as integer, ground floor/stuen = 0, basement/kl = -1)
- size_sqm: Size in square meters (as number)
- rent_current: Current monthly rent (as number)
- tenant_name: Tenant name if available

Return a JSON object with this structure:
{
  "units": [
    {
      "unit_address": "...",
      "unit_zipcode": "...",
      "unit_door": 1,
      "unit_floor": 0,
      "size_sqm": 85.5,
      "rent_current": 12000,
      "tenant_name": "..."
    }
  ],
  "totalFound": 5
}

IMPORTANT:
- Extract EVERY unit mentioned, even with partial data
- Convert Danish floor notations: "st" or "stuen" = 0, "1. sal" = 1, "kl" or "kælder" = -1
- Parse Danish door notations: "tv" = left side, "th" = right side, "mf" = middle
- If unsure about a value, omit it rather than guess
- If a field is not available, omit it or set to null`;

export interface UnitExtractionResult {
  units: ExtractedUnit[];
  totalFound: number;
}

/**
 * Extract rental units from PDF text using LLM
 */
export async function extractUnitsFromText(
  text: string
): Promise<UnitExtractionResult> {
  // Limit text to first 15000 chars for faster processing
  const truncatedText =
    text.length > 15000
      ? text.substring(0, 15000) + "\n\n[Document truncated...]"
      : text;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: UNIT_EXTRACTION_PROMPT },
        {
          role: "user",
          content: `Extract all rental units from this document:\n\n${truncatedText}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Low temperature for consistent extraction
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("[Unit Extractor] No content in OpenAI response");
      return { units: [], totalFound: 0 };
    }

    const parsed = JSON.parse(content);
    const units: ExtractedUnit[] = (parsed.units || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (u: any): ExtractedUnit => ({
        unit_address: u.unit_address ?? undefined,
        unit_zipcode: u.unit_zipcode ?? undefined,
        unit_door: u.unit_door ?? undefined,
        unit_floor: u.unit_floor ?? undefined,
        size_sqm: u.size_sqm ?? undefined,
        rent_current: u.rent_current ?? undefined,
        tenant_name: u.tenant_name ?? undefined,
      })
    );

    return {
      units,
      totalFound: parsed.totalFound || units.length,
    };
  } catch (error) {
    console.error("[Unit Extractor] Failed to extract units:", error);
    return { units: [], totalFound: 0 };
  }
}
