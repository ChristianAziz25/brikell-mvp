import type { Prisma } from "@/generated/client";
import prisma from "@/lib/prisma/client";

interface BulkOpexResult {
  success: boolean;
  inserted: number;
  updated: number;
  errors: Array<{ assetId: string; year: number; error: string }>;
}

export async function upsertOpex(
  data: Prisma.OpexUncheckedCreateInput
) {
  return prisma.opex.upsert({
    where: {
      assetId_opex_year: {
        assetId: data.assetId,
        opex_year: data.opex_year,
      },
    },
    update: {
      asset_name: data.asset_name,
      actual_delinquency: data.actual_delinquency,
      actual_property_management_fee: data.actual_property_management_fee,
      actual_leasing_fee: data.actual_leasing_fee,
      actual_property_taxes: data.actual_property_taxes,
      actual_refuse_collection: data.actual_refuse_collection,
      actual_insurance: data.actual_insurance,
      actual_cleaning: data.actual_cleaning,
      actual_facility_management: data.actual_facility_management,
      actual_service_subscriptions: data.actual_service_subscriptions,
      actual_common_consumption: data.actual_common_consumption,
      actual_home_owner_association: data.actual_home_owner_association,
      budget_delinquency: data.budget_delinquency,
      budget_property_management_fee: data.budget_property_management_fee,
      budget_leasing_fee: data.budget_leasing_fee,
      budget_property_taxes: data.budget_property_taxes,
      budget_refuse_collection: data.budget_refuse_collection,
      budget_insurance: data.budget_insurance,
      budget_cleaning: data.budget_cleaning,
      budget_facility_management: data.budget_facility_management,
      budget_service_subscriptions: data.budget_service_subscriptions,
      budget_common_consumption: data.budget_common_consumption,
      budget_home_owner_association: data.budget_home_owner_association,
    },
    create: data,
  });
}

export async function bulkUpsertOpex(
  data: Prisma.OpexUncheckedCreateInput[]
): Promise<BulkOpexResult> {
  const result: BulkOpexResult = {
    success: true,
    inserted: 0,
    updated: 0,
    errors: [],
  };

  for (const row of data) {
    try {
      const existing = await prisma.opex.findUnique({
        where: {
          assetId_opex_year: {
            assetId: row.assetId,
            opex_year: row.opex_year,
          },
        },
      });

      if (existing) {
        await prisma.opex.update({
          where: { id: existing.id },
          data: {
            asset_name: row.asset_name,
            actual_delinquency: row.actual_delinquency,
            actual_property_management_fee: row.actual_property_management_fee,
            actual_leasing_fee: row.actual_leasing_fee,
            actual_property_taxes: row.actual_property_taxes,
            actual_refuse_collection: row.actual_refuse_collection,
            actual_insurance: row.actual_insurance,
            actual_cleaning: row.actual_cleaning,
            actual_facility_management: row.actual_facility_management,
            actual_service_subscriptions: row.actual_service_subscriptions,
            actual_common_consumption: row.actual_common_consumption,
            actual_home_owner_association: row.actual_home_owner_association,
            budget_delinquency: row.budget_delinquency,
            budget_property_management_fee: row.budget_property_management_fee,
            budget_leasing_fee: row.budget_leasing_fee,
            budget_property_taxes: row.budget_property_taxes,
            budget_refuse_collection: row.budget_refuse_collection,
            budget_insurance: row.budget_insurance,
            budget_cleaning: row.budget_cleaning,
            budget_facility_management: row.budget_facility_management,
            budget_service_subscriptions: row.budget_service_subscriptions,
            budget_common_consumption: row.budget_common_consumption,
            budget_home_owner_association: row.budget_home_owner_association,
          },
        });
        result.updated++;
      } else {
        await prisma.opex.create({ data: row });
        result.inserted++;
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        assetId: row.assetId,
        year: row.opex_year,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return result;
}

export async function getOpexByAsset(assetId: string) {
  return prisma.opex.findMany({
    where: { assetId },
    orderBy: { opex_year: "asc" },
  });
}

export async function deleteOpexForAssetYear(assetId: string, year: number) {
  return prisma.opex.delete({
    where: {
      assetId_opex_year: {
        assetId,
        opex_year: year,
      },
    },
  });
}


