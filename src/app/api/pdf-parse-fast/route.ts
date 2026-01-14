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
  DDResultsResponse,
  DDSummary,
} from "@/lib/pdf-processing/types";

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
      const { text, fileName } = body;

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
        progress: 30,
        message: "Extracting key information...",
      });

      // Generate DD summary using LLM
      const ddSummary = await generateDDSummary(text);

      await sendProgress({
        status: "matching",
        progress: 80,
        message: "Finalizing analysis...",
      });

      // Build results response
      const results: DDResultsResponse = {
        jobId,
        fileName,
        completedAt: new Date().toISOString(),
        summary: ddSummary,
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

  const parsed = JSON.parse(content);
  
  // Validate and return structured summary
  return {
    propertyOverview: parsed.propertyOverview || "Property overview information not available in document.",
    keyFinancials: parsed.keyFinancials || "Key financial information not available in document.",
    rentRollHighlights: parsed.rentRollHighlights || "Rent roll information not available in document.",
    risksAndRedFlags: parsed.risksAndRedFlags || "No specific risks or red flags identified.",
    missingInformation: parsed.missingInformation || "All key information appears to be present.",
  };
}
