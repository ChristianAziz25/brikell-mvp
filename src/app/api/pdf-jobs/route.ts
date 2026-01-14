import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { supabaseAdmin } from "@/lib/supabase/client";
import type { JobCreateResponse } from "@/lib/pdf-processing/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const assetId = formData.get("assetId") as string | null;

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.type.includes("pdf")) {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // 1. Upload to Supabase Storage
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `pdf-uploads/${timestamp}-${sanitizedName}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(filePath, arrayBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    // 2. Create job record
    const job = await prisma.pdfJob.create({
      data: {
        fileName: file.name,
        filePath,
        fileSizeBytes: file.size,
        status: "pending",
        progress: 0,
        retryCount: 0,
        maxRetries: 3,
        assetId: assetId || undefined,
      },
    });

    // 3. Return immediately with job ID
    const response: JobCreateResponse = {
      jobId: job.id,
      status: "pending",
      message: "Job queued for processing",
    };

    return NextResponse.json(response, { status: 202 });
  } catch (error) {
    console.error("PDF job creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const assetId = searchParams.get("assetId");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const jobs = await prisma.pdfJob.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(assetId && { assetId }),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
      select: {
        id: true,
        fileName: true,
        status: true,
        progress: true,
        createdAt: true,
        completedAt: true,
        errorMessage: true,
        retryCount: true,
      },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("PDF jobs list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
