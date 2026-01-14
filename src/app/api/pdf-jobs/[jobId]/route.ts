import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import type { JobStatusResponse } from "@/lib/pdf-processing/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    const job = await prisma.pdfJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        fileName: true,
        status: true,
        progress: true,
        errorMessage: true,
        retryCount: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
        matchingResult: true,
        summary: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Parse matching result for stats if available
    const matchingResult = job.matchingResult as { stats?: any } | null;

    const response: JobStatusResponse = {
      id: job.id,
      fileName: job.fileName,
      status: job.status as any,
      progress: job.progress,
      errorMessage: job.errorMessage || undefined,
      retryCount: job.retryCount,
      createdAt: job.createdAt.toISOString(),
      startedAt: job.startedAt?.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      summary: job.summary || undefined,
    };

    // Include stats summary for completed jobs
    if (job.status === "completed" && matchingResult?.stats) {
      return NextResponse.json({
        ...response,
        stats: matchingResult.stats,
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("PDF job status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    const job = await prisma.pdfJob.findUnique({
      where: { id: jobId },
      select: { status: true },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Don't allow canceling jobs that are currently processing
    if (job.status === "processing" || job.status === "extracting" || job.status === "matching") {
      return NextResponse.json(
        { error: "Cannot cancel job while processing" },
        { status: 409 }
      );
    }

    await prisma.pdfJob.delete({
      where: { id: jobId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PDF job delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
