/**
 * Fast PDF Parse API Route - Due Diligence Summary
 *
 * This route parses PDFs in memory and generates a structured DD-style investment memo summary.
 * No database storage or unit matching is performed.
 *
 * PERFORMANCE OPTIMIZATIONS:
 * 1. Client-side PDF extraction (eliminates file upload/download)
 * 2. In-memory processing (no database writes)
 * 3. Single LLM call for comprehensive summary
 * 4. Structured JSON response for easy rendering
 */

import { NextRequest } from "next/server";
import OpenAI from "openai";
import type {
  JobStatus,
  DDSummary,
  UnitMatchResult,
  DDResultsWithUnits,
} from "@/lib/pdf-processing/types";
import { extractUnitsFromText } from "@/lib/pdf-processing/unit-extractor";
import { matchUnitsInMemory } from "@/lib/pdf-processing/fast-matcher";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// DD Summary generation prompt
const DD_SUMMARY_PROMPT = `You are a senior real estate investment analyst specializing in due diligence. 
Analyze the provided investment memo or property document and generate a comprehensive, structured summary.

Return a JSON object with this EXACT structure:
{
  "propertyOverview": "2-4 sentences describing the property, location, type, size, and key characteristics.",
  "keyFinancials": "2-4 sentences covering purchase price, NOI, cap rate, revenue, expenses, and key financial metrics mentioned.",
  "rentRollHighlights": "2-4 sentences about occupancy, tenant mix, lease terms, rental rates, and rent roll composition.",
  "risksAndRedFlags": "2-4 sentences identifying potential risks, concerns, red flags, or issues that require attention.",
  "missingInformation": "2-4 sentences about what information is missing, unclear, or needs further investigation."
}

Be concise, professional, and focus on actionable insights. Use bullet points or short paragraphs.`;

interface FastParseRequest {
  text: string;
  fileName: string;
  pageCount: number;
  assetId?: string;
  enableUnitMatching?: boolean;
}

interface ProgressUpdate {
  status: JobStatus;
  progress: number;
  message: string;
}


export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  // Create a TransformStream for SSE
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Helper to send progress updates
  const sendProgress = async (update: ProgressUpdate) => {
    const data = `data: ${JSON.stringify(update)}\n\n`;
    await writer.write(encoder.encode(data));
  };

  // Start processing in background
  (async () => {
    try {
      const body: FastParseRequest = await request.json();
      const { text, fileName, assetId, enableUnitMatching = true } = body;

      if (!text || !fileName) {
        await sendProgress({
          status: "failed",
          progress: 0,
          message: "Missing required fields: text and fileName",
        });
        await writer.close();
        return;
      }

      // Generate a simple job ID for tracking (no database storage)
      const jobId = `dd-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      await sendProgress({
        status: "pending",
        progress: 10,
        message: "Analyzing document structure...",
      });

      await sendProgress({
        status: "extracting",
        progress: 20,
        message: "Extracting key information...",
      });

      // Run DD summary and unit extraction in PARALLEL for speed
      const [ddSummary, extractionResult] = await Promise.all([
        generateDDSummary(text),
        enableUnitMatching ? extractUnitsFromText(text) : Promise.resolve(null),
      ]);

      // Match units if extraction was enabled and units were found
      let unitMatching: UnitMatchResult | undefined;
      if (extractionResult && extractionResult.units.length > 0) {
        await sendProgress({
          status: "matching",
          progress: 70,
          message: "Matching units against database...",
        });

        unitMatching = await matchUnitsInMemory(extractionResult.units, assetId);

        await sendProgress({
          status: "matching",
          progress: 90,
          message: unitMatching.hasAnomalies
            ? `Found ${unitMatching.unmatchedUnits.length} potential anomalies...`
            : "All units matched successfully...",
        });
      } else if (enableUnitMatching) {
        // No units found in document
        unitMatching = {
          unmatchedUnits: [],
          matchedCount: 0,
          totalExtracted: 0,
          hasAnomalies: false,
        };

        await sendProgress({
          status: "matching",
          progress: 90,
          message: "No unit data found in document...",
        });
      } else {
        await sendProgress({
          status: "matching",
          progress: 80,
          message: "Finalizing analysis...",
        });
      }

      // Build results response with unit matching
      const results: DDResultsWithUnits = {
        jobId,
        fileName,
        completedAt: new Date().toISOString(),
        summary: ddSummary,
        unitMatching,
      };

      await sendProgress({
        status: "completed",
        progress: 100,
        message: "Complete",
      });

      // Send final results
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ type: "results", data: results })}\n\n`)
      );
    } catch (error) {
      console.error("[DD Parse] Error:", error);

      await sendProgress({
        status: "failed",
        progress: 0,
        message: error instanceof Error ? error.message : "Processing failed",
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * Generate DD-style investment memo summary using OpenAI LLM
 */
async function generateDDSummary(text: string): Promise<DDSummary> {
  // OPTIMIZATION: Limit text to first 25000 chars for faster processing while maintaining context
  const truncatedText = text.length > 25000 
    ? text.substring(0, 25000) + "\n\n[Document truncated for faster processing...]"
    : text;
    
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: DD_SUMMARY_PROMPT },
      { role: "user", content: `Analyze this investment memo or property document and generate a structured due diligence summary:\n\n${truncatedText}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  // Parse JSON with error handling for malformed LLM output
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch (parseError) {
    console.error("[DD Parse] Failed to parse LLM JSON response:", parseError);
    console.error("[DD Parse] Raw content:", content.substring(0, 500));
    // Return fallback summary when JSON parsing fails
    return {
      propertyOverview: "Unable to parse document structure. Please try uploading again.",
      keyFinancials: "Financial information extraction failed.",
      rentRollHighlights: "Rent roll information extraction failed.",
      risksAndRedFlags: "Risk analysis unavailable due to processing error.",
      missingInformation: "Document parsing encountered an error. Please retry.",
    };
  }

  // Validate and return structured summary
  return {
    propertyOverview: typeof parsed.propertyOverview === 'string'
      ? parsed.propertyOverview
      : "Property overview information not available in document.",
    keyFinancials: typeof parsed.keyFinancials === 'string'
      ? parsed.keyFinancials
      : "Key financial information not available in document.",
    rentRollHighlights: typeof parsed.rentRollHighlights === 'string'
      ? parsed.rentRollHighlights
      : "Rent roll information not available in document.",
    risksAndRedFlags: typeof parsed.risksAndRedFlags === 'string'
      ? parsed.risksAndRedFlags
      : "No specific risks or red flags identified.",
    missingInformation: typeof parsed.missingInformation === 'string'
      ? parsed.missingInformation
      : "All key information appears to be present.",
  };
}
