import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { detectAnomalies, calculateRiskFlags } from "@/lib/anomaly-detection/detector";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ExtractedData = {
  documentType: "financial_statement" | "contract" | "other";
  summary: string;
  financials?: {
    revenue?: { value: number; period: string };
    expenses?: { value: number; period: string };
    netIncome?: { value: number; period: string };
    otherMetrics?: { label: string; value: string }[];
  };
  dates?: { label: string; date: string }[];
  parties?: { role: string; name: string }[];
  keyTerms?: { term: string; value: string }[];
  rawText?: string;
};

const EXTRACTION_PROMPT = `You are a document analysis expert. Analyze the document and provide a clean, formatted summary.

Format your response in clean, readable markdown with the following structure:

**Summary**
[2-3 sentence summary of the document]

**Key Metrics**
- [Metric name]: [Value]
- [Continue for all important numbers/percentages]

**Parties** (if applicable)
- [Role]: [Name]

**Important Dates** (if applicable)
- [Label]: [Date]

**Key Terms**
- [Term]: [Value/Description]

Keep it minimal and scannable. Only include sections that have actual data.`;

/**
 * Parse extracted markdown content into structured ExtractedData
 */
function parseExtractedContent(content: string): ExtractedData {
  const extracted: ExtractedData = {
    documentType: "other",
    summary: "",
  };

  // Extract summary
  const summaryMatch = content.match(/\*\*Summary\*\*\s*\n([^\n]+(?:\n[^\n]+)*?)(?=\*\*|$)/i);
  if (summaryMatch) {
    extracted.summary = summaryMatch[1].trim();
  }

  // Extract key metrics
  const metricsMatch = content.match(/\*\*Key Metrics\*\*\s*\n((?:- .+\n?)+)/i);
  if (metricsMatch) {
    const metricsText = metricsMatch[1];
    const metricLines = metricsText.match(/- (.+): (.+)/g) || [];
    extracted.financials = {
      otherMetrics: metricLines.map((line) => {
        const match = line.match(/- (.+): (.+)/);
        return {
          label: match?.[1]?.trim() || "",
          value: match?.[2]?.trim() || "",
        };
      }),
    };
  }

  // Extract parties
  const partiesMatch = content.match(/\*\*Parties\*\*\s*\n((?:- .+\n?)+)/i);
  if (partiesMatch) {
    const partiesText = partiesMatch[1];
    const partyLines = partiesText.match(/- (.+): (.+)/g) || [];
    extracted.parties = partyLines.map((line) => {
      const match = line.match(/- (.+): (.+)/);
      return {
        role: match?.[1]?.trim() || "",
        name: match?.[2]?.trim() || "",
      };
    });
  }

  // Extract dates
  const datesMatch = content.match(/\*\*Important Dates\*\*\s*\n((?:- .+\n?)+)/i);
  if (datesMatch) {
    const datesText = datesMatch[1];
    const dateLines = datesText.match(/- (.+): (.+)/g) || [];
    extracted.dates = dateLines.map((line) => {
      const match = line.match(/- (.+): (.+)/);
      return {
        label: match?.[1]?.trim() || "",
        date: match?.[2]?.trim() || "",
      };
    });
  }

  // Extract key terms
  const termsMatch = content.match(/\*\*Key Terms\*\*\s*\n((?:- .+\n?)+)/i);
  if (termsMatch) {
    const termsText = termsMatch[1];
    const termLines = termsText.match(/- (.+): (.+)/g) || [];
    extracted.keyTerms = termLines.map((line) => {
      const match = line.match(/- (.+): (.+)/);
      return {
        term: match?.[1]?.trim() || "",
        value: match?.[2]?.trim() || "",
      };
    });
  }

  // Determine document type
  if (content.toLowerCase().includes("financial") || content.toLowerCase().includes("statement")) {
    extracted.documentType = "financial_statement";
  } else if (content.toLowerCase().includes("contract") || content.toLowerCase().includes("lease")) {
    extracted.documentType = "contract";
  }

  return extracted;
}

/**
 * Extract address from content
 */
function extractAddressFromContent(content: string): string | undefined {
  // Look for address patterns
  const addressPatterns = [
    /address[:\s]+([^\n]+)/i,
    /location[:\s]+([^\n]+)/i,
    /(\d+\s+[A-Za-z\s]+(?:Street|Road|Avenue|Vej|Gade|Plads))/i,
  ];

  for (const pattern of addressPatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1]?.trim();
    }
  }

  return undefined;
}

/**
 * Extract zip code from content
 */
function extractZipCodeFromContent(content: string): string | undefined {
  // Danish zip codes are 4 digits
  const zipPattern = /\b(\d{4})\b/;
  const match = content.match(zipPattern);
  return match?.[1];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No PDF file provided" },
        { status: 400 }
      );
    }

    if (!file.type.includes("pdf")) {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    // Convert file to Uint8Array (required by unpdf)
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Extract text from PDF using unpdf (ESM-compatible)
    let pdfText: string;
    try {
      const { extractText } = await import("unpdf");
      const result = await extractText(uint8Array);
      // Handle both string and array returns from unpdf
      if (Array.isArray(result.text)) {
        pdfText = result.text.join("\n");
      } else if (typeof result.text === "string") {
        pdfText = result.text;
      } else {
        pdfText = String(result.text || "");
      }
    } catch (pdfError) {
      console.error("PDF parsing error:", pdfError);
      return NextResponse.json(
        { error: "Failed to parse PDF. The file may be corrupted or password-protected." },
        { status: 400 }
      );
    }

    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from PDF. The document may be image-based or empty." },
        { status: 400 }
      );
    }

    // Limit text length to avoid token limits
    const maxChars = 15000;
    const truncatedText = pdfText.length > maxChars 
      ? pdfText.substring(0, maxChars) + "\n\n[Document truncated due to length...]"
      : pdfText;

    // Send to OpenAI for streaming analysis
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: EXTRACTION_PROMPT,
        },
        {
          role: "user",
          content: `Please analyze this document:\n\n${truncatedText}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
      stream: true,
    });

    // Create a streaming response
    const encoder = new TextEncoder();
    let fullContent = "";
    
    const readable = new ReadableStream({
      async start(controller) {
        // Send file info first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "info", fileName: file.name })}\n\n`));
        
        // Stream the extraction
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullContent += content;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "content", content })}\n\n`));
          }
        }
        
        // After streaming completes, run anomaly detection
        try {
          // Parse the extracted content into structured data
          const extractedData = parseExtractedContent(fullContent);
          
          // Extract address for cross-referencing
          const address = extractAddressFromContent(fullContent);
          const zipCode = extractZipCodeFromContent(fullContent);
          
          // Run anomaly detection
          const anomalies = await detectAnomalies(extractedData, address, zipCode);
          const riskFlags = calculateRiskFlags(anomalies);
          
          // Store analysis in database
          const analysis = await prisma.documentAnalysis.create({
            data: {
              fileName: file.name,
              documentType: extractedData.documentType || "other",
              extractedData: extractedData as any,
              propertyAddress: address,
              propertyZipCode: zipCode,
              anomalies: anomalies as any,
              riskFlags: riskFlags as any,
            },
          });
          
          // Create anomaly records
          if (anomalies.length > 0) {
            await prisma.anomaly.createMany({
              data: anomalies.map((anomaly) => ({
                documentId: analysis.id,
                type: anomaly.type,
                severity: anomaly.severity,
                field: anomaly.field,
                expectedValue: anomaly.expectedValue,
                actualValue: anomaly.actualValue,
                source: anomaly.source,
                description: anomaly.description,
              })),
            });
          }
          
          // Send anomalies and risk flags if any
          if (anomalies.length > 0 || riskFlags.length > 0) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ 
                  type: "anomalies", 
                  anomalies, 
                  riskFlags 
                })}\n\n`
              )
            );
          }
        } catch (error) {
          console.error("Anomaly detection error:", error);
          // Don't fail the request if anomaly detection fails
        }
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("PDF parsing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse PDF" },
      { status: 500 }
    );
  }
}
