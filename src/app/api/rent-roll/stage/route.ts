import { RentStatus } from "@/generated/enums";
import prisma from "@/lib/prisma/client";
import { NextResponse } from "next/server";

type StageUpdateBody = {
  unitId: number;
  status: string; // "vacant" | "occupied" | "terminated"
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as StageUpdateBody;

    if (!body || typeof body.unitId !== "number" || !body.status) {
      return NextResponse.json(
        { error: "unitId (number) and status are required" },
        { status: 400 }
      );
    }

    const updated = await prisma.rentRollUnit.update({
      where: { unit_id: body.unitId },
      data: {
        units_status: body.status as RentStatus,
      },
    });

    return NextResponse.json({
      success: true,
      unitId: updated.unit_id,
      status: updated.units_status,
    });
  } catch (error) {
    console.error("Error updating rent roll stage:", error);
    return NextResponse.json(
      { error: "Failed to update rent roll stage" },
      { status: 500 }
    );
  }
}


