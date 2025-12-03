import type { Prisma } from "@/generated/client";
import prisma from "@/lib/prisma/client";

interface BulkCapexResult {
  success: boolean;
  inserted: number;
  updated: number;
  errors: Array<{ assetId: string; year: number; error: string }>;
}

export async function upsertCapex(
  data: Prisma.CapexUncheckedCreateInput
) {
  return prisma.capex.upsert({
    where: {
      assetId_capex_year: {
        assetId: data.assetId,
        capex_year: data.capex_year,
      },
    },
    update: {
      asset_name: data.asset_name,
      common_areas_actuals: data.common_areas_actuals,
      units_renovations_actuals: data.units_renovations_actuals,
      elevator_maintnance_actuals: data.elevator_maintnance_actuals,
      roof_maintnance_actuals: data.roof_maintnance_actuals,
      fire_safety_actuals: data.fire_safety_actuals,
      outdoor_area_actuals: data.outdoor_area_actuals,
      total_capex_actuals: data.total_capex_actuals,
      common_areas_budget: data.common_areas_budget,
      units_renovations_budget: data.units_renovations_budget,
      elevator_maintnance_budget: data.elevator_maintnance_budget,
      roof_maintnance_budget: data.roof_maintnance_budget,
      fire_safety_budget: data.fire_safety_budget,
      outdoor_area_budget: data.outdoor_area_budget,
      total_capex_budget: data.total_capex_budget,
    },
    create: data,
  });
}

export async function bulkUpsertCapex(
  data: Prisma.CapexUncheckedCreateInput[]
): Promise<BulkCapexResult> {
  const result: BulkCapexResult = {
    success: true,
    inserted: 0,
    updated: 0,
    errors: [],
  };

  for (const row of data) {
    try {
      const existing = await prisma.capex.findUnique({
        where: {
          assetId_capex_year: {
            assetId: row.assetId,
            capex_year: row.capex_year,
          },
        },
      });

      if (existing) {
        await prisma.capex.update({
          where: { id: existing.id },
          data: {
            asset_name: row.asset_name,
            common_areas_actuals: row.common_areas_actuals,
            units_renovations_actuals: row.units_renovations_actuals,
            elevator_maintnance_actuals: row.elevator_maintnance_actuals,
            roof_maintnance_actuals: row.roof_maintnance_actuals,
            fire_safety_actuals: row.fire_safety_actuals,
            outdoor_area_actuals: row.outdoor_area_actuals,
            total_capex_actuals: row.total_capex_actuals,
            common_areas_budget: row.common_areas_budget,
            units_renovations_budget: row.units_renovations_budget,
            elevator_maintnance_budget: row.elevator_maintnance_budget,
            roof_maintnance_budget: row.roof_maintnance_budget,
            fire_safety_budget: row.fire_safety_budget,
            outdoor_area_budget: row.outdoor_area_budget,
            total_capex_budget: row.total_capex_budget,
          },
        });
        result.updated++;
      } else {
        await prisma.capex.create({ data: row });
        result.inserted++;
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        assetId: row.assetId,
        year: row.capex_year,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return result;
}

export async function getCapexByAsset(assetId: string) {
  return prisma.capex.findMany({
    where: { assetId },
    orderBy: { capex_year: "asc" },
  });
}

export async function deleteCapexForAssetYear(assetId: string, year: number) {
  return prisma.capex.delete({
    where: {
      assetId_capex_year: {
        assetId,
        capex_year: year,
      },
    },
  });
}


