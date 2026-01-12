import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

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
    const readable = new ReadableStream({
      async start(controller) {
        // Send file info first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "info", fileName: file.name })}\n\n`));
        
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "content", content })}\n\n`));
          }
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
