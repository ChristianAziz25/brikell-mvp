// Supabase Edge Function: process-pdf-job
// Triggered by pg_cron to process pending PDF parsing jobs

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Unit extraction prompt for LLM
const UNIT_EXTRACTION_PROMPT = `You are a document parser specializing in real estate rent rolls and property documents.
Extract all rental units from the provided document text. For each unit, extract:
- unit_address: Full street address
- unit_zipcode: Postal/zip code
- unit_door: Door/apartment number (as integer)
- unit_floor: Floor number (as integer, ground floor = 0)
- size_sqm: Size in square meters (as number)
- rent_current: Current monthly rent (as number)
- tenant_name: Tenant name if available
- lease_start: Lease start date (YYYY-MM-DD format)
- lease_end: Lease end date (YYYY-MM-DD format)

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
      "tenant_name": "...",
      "lease_start": "2024-01-01",
      "lease_end": "2025-12-31"
    }
  ],
  "metadata": {
    "pageCount": 1,
    "confidence": 0.95
  }
}

If a field is not available, omit it or set to null.`;

// Summary generation prompt for LLM
const SUMMARY_GENERATION_PROMPT = `You are a due diligence analyst. Given the matching results between a PDF rent roll and a portfolio database, generate a brief summary.

Return ONLY a JSON object with this structure:
{
  "bulletPoints": [
    "Brief insight about the matching results",
    "Another key finding",
    "Actionable recommendation if needed"
  ]
}

Guidelines:
- Generate 3-5 concise bullet points
- Focus on actionable insights
- Mention specific numbers (units matched, missing, confidence levels)
- Be professional and direct
- If there are low confidence matches, recommend review`;

interface ExtractedUnit {
  unit_address?: string;
  unit_zipcode?: string;
  unit_door?: number;
  unit_floor?: number;
  size_sqm?: number;
  rent_current?: number;
  tenant_name?: string;
  lease_start?: string;
  lease_end?: string;
}

interface ExtractionResult {
  units: ExtractedUnit[];
  metadata: {
    pageCount: number;
    confidence: number;
  };
}

interface PdfJob {
  id: string;
  file_path: string;
  asset_id?: string;
  retry_count: number;
  max_retries: number;
}

serve(async (req) => {
  const processorId = crypto.randomUUID();

  // Allow CORS for local development
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  let job: PdfJob | null = null;

  try {
    // 1. Claim a pending job atomically
    const { data: claimedJob, error: claimError } = await supabase.rpc(
      "claim_pdf_job",
      { p_processor_id: processorId }
    );

    if (claimError) {
      console.error("Error claiming job:", claimError);
      return new Response(
        JSON.stringify({ error: "Failed to claim job", details: claimError }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!claimedJob || claimedJob.length === 0) {
      return new Response(
        JSON.stringify({ message: "No jobs available" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    job = claimedJob[0] as PdfJob;
    console.log(`Processing job ${job.id}`);

    // 2. Update status to extracting
    await updateProgress(job.id, "extracting", 10);

    // 3. Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(job.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download PDF: ${downloadError?.message}`);
    }

    await updateProgress(job.id, "extracting", 30);

    // 4. Extract text from PDF (using pdf-parse alternative for Deno)
    const pdfText = await extractTextFromPdf(fileData);

    await updateProgress(job.id, "extracting", 50);

    // 5. Use LLM to extract units
    const extractionResult = await extractUnitsWithLLM(pdfText);

    await updateProgress(job.id, "matching", 70);

    // 6. Save parsed units to database
    await saveParsedUnits(job.id, extractionResult.units);

    await updateProgress(job.id, "matching", 85);

    // 7. Match against units table
    const matchResult = await matchUnits(job.id, job.asset_id);

    await updateProgress(job.id, "matching", 95);

    // 8. Generate summary
    const summary = await generateSummary(matchResult.stats);

    // 9. Complete the job
    await supabase
      .from("pdf_job")
      .update({
        status: "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
        matching_result: matchResult,
        summary: summary,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    console.log(`Job ${job.id} completed successfully`);

    return new Response(
      JSON.stringify({ success: true, jobId: job.id, result: matchResult }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Job processing error:", err);

    // Handle failure with retry logic
    if (job) {
      await handleJobFailure(job.id, err as Error);
    }

    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

async function updateProgress(jobId: string, status: string, progress: number) {
  await supabase
    .from("pdf_job")
    .update({
      status,
      progress,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

async function handleJobFailure(jobId: string, error: Error) {
  const { data: job } = await supabase
    .from("pdf_job")
    .select("retry_count, max_retries")
    .eq("id", jobId)
    .single();

  const newRetryCount = (job?.retry_count || 0) + 1;
  const maxRetries = job?.max_retries || 3;
  const shouldRetry = newRetryCount < maxRetries;

  // Exponential backoff: 10s, 30s, 90s
  const backoffMs = 10_000 * Math.pow(3, newRetryCount);

  await supabase
    .from("pdf_job")
    .update({
      status: "failed",
      error_message: error.message,
      retry_count: newRetryCount,
      next_retry_at: shouldRetry
        ? new Date(Date.now() + backoffMs).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  console.log(
    `Job ${jobId} failed. Retry ${newRetryCount}/${maxRetries}. ` +
      (shouldRetry ? `Next retry in ${backoffMs / 1000}s` : "Max retries reached")
  );
}

interface MatchingStats {
  totalPdfUnits: number;
  totalDbUnits: number;
  matched: number;
  missing: number;
  extra: number;
  avgConfidence: number;
}

async function generateSummary(stats: MatchingStats): Promise<string> {
  try {
    const prompt = `Matching Results:
- Total units in PDF: ${stats.totalPdfUnits}
- Matched units: ${stats.matched}
- Missing (in PDF but not in portfolio): ${stats.missing}
- Extra (in portfolio but not in PDF): ${stats.extra}
- Average match confidence: ${(stats.avgConfidence * 100).toFixed(1)}%

Generate 3-5 bullet points summarizing these findings.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SUMMARY_GENERATION_PROMPT },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error("Summary generation failed:", await response.text());
      return generateFallbackSummary(stats);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return generateFallbackSummary(stats);
    }

    const parsed = JSON.parse(content);
    return parsed.bulletPoints?.join("\n") || generateFallbackSummary(stats);
  } catch (err) {
    console.error("Summary generation error:", err);
    return generateFallbackSummary(stats);
  }
}

function generateFallbackSummary(stats: MatchingStats): string {
  const bullets: string[] = [];

  if (stats.matched > 0) {
    bullets.push(`${stats.matched} unit${stats.matched !== 1 ? 's' : ''} matched with your portfolio`);
  }
  if (stats.missing > 0) {
    bullets.push(`${stats.missing} unit${stats.missing !== 1 ? 's' : ''} from the document not found in portfolio`);
  }
  if (stats.extra > 0) {
    bullets.push(`${stats.extra} portfolio unit${stats.extra !== 1 ? 's' : ''} not referenced in document`);
  }
  if (stats.avgConfidence > 0) {
    const conf = Math.round(stats.avgConfidence * 100);
    bullets.push(`Average match confidence: ${conf}%`);
    if (conf < 85) {
      bullets.push("Some matches have lower confidence - review recommended");
    }
  }

  return bullets.join("\n") || "Analysis complete.";
}

async function extractTextFromPdf(fileData: Blob): Promise<string> {
  // Convert blob to array buffer
  const arrayBuffer = await fileData.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Simple text extraction - for production, use a proper PDF library
  // This is a basic implementation that extracts readable text
  let text = "";

  // Try to decode as text (works for some PDFs with embedded text)
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const rawText = decoder.decode(uint8Array);

  // Extract text between stream markers (basic PDF text extraction)
  const streamMatches = rawText.matchAll(/stream\s*([\s\S]*?)\s*endstream/g);
  for (const match of streamMatches) {
    // Clean up the text
    const streamContent = match[1]
      .replace(/\\/g, "")
      .replace(/\([^)]*\)/g, (m) => m.slice(1, -1))
      .replace(/[^\x20-\x7E\n\r]/g, " ")
      .replace(/\s+/g, " ");

    if (streamContent.length > 10) {
      text += streamContent + "\n";
    }
  }

  // Fallback: try to extract any readable text
  if (text.length < 100) {
    text = rawText
      .replace(/[^\x20-\x7E\n\r]/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 50000); // Limit size
  }

  return text.slice(0, 15000); // Limit to avoid token limits
}

async function extractUnitsWithLLM(pdfText: string): Promise<ExtractionResult> {
  if (!openaiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: UNIT_EXTRACTION_PROMPT,
        },
        {
          role: "user",
          content: `Extract all rental units from this document:\n\n${pdfText}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  const parsed = JSON.parse(content);

  return {
    units: parsed.units || [],
    metadata: {
      pageCount: parsed.metadata?.pageCount || 1,
      confidence: parsed.metadata?.confidence || 0.5,
    },
  };
}

async function saveParsedUnits(jobId: string, units: ExtractedUnit[]) {
  if (units.length === 0) return;

  const records = units.map((unit) => ({
    job_id: jobId,
    unit_address: unit.unit_address,
    unit_zipcode: unit.unit_zipcode,
    unit_door: unit.unit_door,
    unit_floor: unit.unit_floor,
    size_sqm: unit.size_sqm,
    rent_current: unit.rent_current,
    tenant_name: unit.tenant_name,
    lease_start: unit.lease_start,
    lease_end: unit.lease_end,
    match_status: "pending",
  }));

  const { error } = await supabase.from("pdf_parsed_units").insert(records);

  if (error) {
    throw new Error(`Failed to save parsed units: ${error.message}`);
  }
}

async function matchUnits(jobId: string, assetId?: string) {
  // Get parsed units
  const { data: pdfUnits, error: pdfError } = await supabase
    .from("pdf_parsed_units")
    .select("*")
    .eq("job_id", jobId);

  if (pdfError) {
    throw new Error(`Failed to get parsed units: ${pdfError.message}`);
  }

  if (!pdfUnits || pdfUnits.length === 0) {
    return {
      stats: {
        totalPdfUnits: 0,
        totalDbUnits: 0,
        matched: 0,
        missing: 0,
        extra: 0,
        avgConfidence: 0,
      },
      processedAt: new Date().toISOString(),
    };
  }

  // Get DB units (scoped to asset if provided)
  const dbQuery = supabase.from("rent_roll_unit").select("*");
  if (assetId) {
    dbQuery.eq("assetId", assetId);
  }

  const { data: dbUnits, error: dbError } = await dbQuery;

  if (dbError) {
    throw new Error(`Failed to get DB units: ${dbError.message}`);
  }

  // Simple matching logic
  const matchedDbIds = new Set<number>();
  let matchedCount = 0;
  let totalConfidence = 0;

  for (const pdfUnit of pdfUnits) {
    let bestMatch = null;
    let bestScore = 0;

    for (const dbUnit of dbUnits || []) {
      if (matchedDbIds.has(dbUnit.unit_id)) continue;

      let score = 0;

      // Zipcode match (high weight)
      if (pdfUnit.unit_zipcode === dbUnit.unit_zipcode) {
        score += 0.3;
      }

      // Floor + Door match
      if (pdfUnit.unit_floor === dbUnit.unit_floor) {
        score += 0.2;
      }
      if (pdfUnit.unit_door === dbUnit.unit_door) {
        score += 0.2;
      }

      // Size match (within 10%)
      if (pdfUnit.size_sqm && dbUnit.size_sqm) {
        const sizeDiff = Math.abs(pdfUnit.size_sqm - dbUnit.size_sqm) / dbUnit.size_sqm;
        if (sizeDiff <= 0.1) {
          score += 0.3;
        } else if (sizeDiff <= 0.2) {
          score += 0.15;
        }
      }

      if (score > bestScore && score >= 0.7) {
        bestScore = score;
        bestMatch = dbUnit;
      }
    }

    if (bestMatch) {
      await supabase
        .from("pdf_parsed_units")
        .update({
          match_status: "matched",
          matched_unit_id: bestMatch.unit_id,
          match_confidence: bestScore,
          match_method: "composite",
        })
        .eq("id", pdfUnit.id);

      matchedDbIds.add(bestMatch.unit_id);
      matchedCount++;
      totalConfidence += bestScore;
    } else {
      await supabase
        .from("pdf_parsed_units")
        .update({
          match_status: "missing",
        })
        .eq("id", pdfUnit.id);
    }
  }

  const extraCount = (dbUnits?.length || 0) - matchedDbIds.size;

  return {
    stats: {
      totalPdfUnits: pdfUnits.length,
      totalDbUnits: dbUnits?.length || 0,
      matched: matchedCount,
      missing: pdfUnits.length - matchedCount,
      extra: extraCount,
      avgConfidence: matchedCount > 0 ? totalConfidence / matchedCount : 0,
    },
    processedAt: new Date().toISOString(),
  };
}
