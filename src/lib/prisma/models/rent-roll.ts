import type {
  RentRollUnitCreateInput,
  RentRollUnitUncheckedCreateInput,
} from "@/generated/models/RentRollUnit";
import prisma from "@/lib/prisma/client";

interface BulkInsertResult {
  success: boolean;
  inserted: number;
  updated: number;
  errors: Array<{ unitId: number; error: string }>;
}

// TODO: requires zod to runtime check types

async function resolveAssetIdFromRentRoll(
  unit: Pick<
    RentRollUnitCreateInput & { assetId?: string },
    "assetId" | "property_name" | "unit_address" | "unit_zipcode"
  >
): Promise<string> {
  // 1) If caller explicitly provided an assetId, prefer that
  if (unit.assetId) {
    const existingById = await prisma.asset.findUnique({
      where: { id: unit.assetId },
    });

    if (existingById) return existingById.id;

    const created = await prisma.asset.create({
      data: {
        id: unit.assetId,
        name: unit.property_name ?? unit.assetId,
        address: unit.unit_address,
      },
    });

    return created.id;
  }

  // 2) Fallback: look up or create asset by property_name
  if (unit.property_name) {
    const existingByName = await prisma.asset.findFirst({
      where: { name: unit.property_name },
    });

    if (existingByName) return existingByName.id;

    const created = await prisma.asset.create({
      data: {
        name: unit.property_name,
        address: unit.unit_address,
      },
    });

    return created.id;
  }

  // 3) Final fallback: a shared "Unknown Asset"
  const fallbackName = "Unknown Asset";
  const existingFallback = await prisma.asset.findFirst({
    where: { name: fallbackName },
  });

  if (existingFallback) return existingFallback.id;

  const createdFallback = await prisma.asset.create({
    data: { name: fallbackName },
  });

  return createdFallback.id;
}

export async function upsertRentRollUnit(
  data: RentRollUnitCreateInput & { assetId?: string }
) {
  const assetId = await resolveAssetIdFromRentRoll(data);

  return prisma.rentRollUnit.upsert({
    where: { unit_id: data.unit_id },
    update: {
      assetId,
      property_build_year: data.property_build_year,
      property_name: data.property_name,
      unit_address: data.unit_address,
      unit_zipcode: data.unit_zipcode,
      unit_door: data.unit_door,
      unit_floor: data.unit_floor,
      utilites_cost: data.utilites_cost,
      unit_type: data.unit_type,
      size_sqm: data.size_sqm,
      rooms_amount: data.rooms_amount,
      bedrooms_amount: data.bedrooms_amount,
      bathrooms_amount: data.bathrooms_amount,
      rent_current_gri: data.rent_current_gri,
      rent_budget_tri: data.rent_budget_tri,
      units_status: data.units_status,
      lease_start: data.lease_start,
      lease_end: data.lease_end,
      tenant_name1: data.tenant_name1,
      tenant_name2: data.tenant_name2,
      tenant_number1: data.tenant_number1,
      tenant_number2: data.tenant_number2,
      tenant_mail1: data.tenant_mail1,
      tenant_mail2: data.tenant_mail2,
    },
    create: {
      assetId,
      unit_id: data.unit_id,
      property_build_year: data.property_build_year,
      property_name: data.property_name,
      unit_address: data.unit_address,
      unit_zipcode: data.unit_zipcode,
      unit_door: data.unit_door,
      unit_floor: data.unit_floor,
      utilites_cost: data.utilites_cost,
      unit_type: data.unit_type,
      size_sqm: data.size_sqm,
      rooms_amount: data.rooms_amount,
      bedrooms_amount: data.bedrooms_amount,
      bathrooms_amount: data.bathrooms_amount,
      rent_current_gri: data.rent_current_gri,
      rent_budget_tri: data.rent_budget_tri,
      units_status: data.units_status,
      lease_start: data.lease_start,
      lease_end: data.lease_end,
      tenant_name1: data.tenant_name1,
      tenant_name2: data.tenant_name2,
      tenant_number1: data.tenant_number1,
      tenant_number2: data.tenant_number2,
      tenant_mail1: data.tenant_mail1,
      tenant_mail2: data.tenant_mail2,
    },
  });
}

export async function bulkUpsertRentRollUnits(
  data: (RentRollUnitCreateInput & { assetId?: string })[]
): Promise<BulkInsertResult> {
  const result: BulkInsertResult = {
    success: true,
    inserted: 0,
    updated: 0,
    errors: [],
  };

  for (const unit of data) {
    try {
      const assetId = await resolveAssetIdFromRentRoll(unit);

      const existing = await prisma.rentRollUnit.findUnique({
        where: { unit_id: unit.unit_id },
      });

      if (existing) {
        await prisma.rentRollUnit.update({
          where: { unit_id: unit.unit_id },
          data: {
            assetId,
            property_build_year: unit.property_build_year,
            property_name: unit.property_name,
            unit_address: unit.unit_address,
            unit_zipcode: unit.unit_zipcode,
            unit_door: unit.unit_door,
            unit_floor: unit.unit_floor,
            utilites_cost: unit.utilites_cost,
            unit_type: unit.unit_type,
            size_sqm: unit.size_sqm,
            rooms_amount: unit.rooms_amount,
            bedrooms_amount: unit.bedrooms_amount,
            bathrooms_amount: unit.bathrooms_amount,
            rent_current_gri: unit.rent_current_gri,
            rent_budget_tri: unit.rent_budget_tri,
            units_status: unit.units_status,
            lease_start: unit.lease_start,
            lease_end: unit.lease_end,
            tenant_name1: unit.tenant_name1,
            tenant_name2: unit.tenant_name2,
            tenant_number1: unit.tenant_number1,
            tenant_number2: unit.tenant_number2,
            tenant_mail1: unit.tenant_mail1,
            tenant_mail2: unit.tenant_mail2,
          },
        });
        result.updated++;
      } else {
        const createData: RentRollUnitUncheckedCreateInput = {
          assetId,
          property_build_year: unit.property_build_year ?? 0,
          property_name: unit.property_name ?? "",
          unit_address: unit.unit_address ?? "",
          unit_zipcode: unit.unit_zipcode ?? "",
          utilites_cost: unit.utilites_cost ?? 0,
          unit_type: unit.unit_type ?? "",
          size_sqm: unit.size_sqm ?? 0,
          rooms_amount: unit.rooms_amount ?? 0,
          bedrooms_amount: unit.bedrooms_amount ?? 0,
          bathrooms_amount: unit.bathrooms_amount ?? 0,
          rent_current_gri: unit.rent_current_gri ?? 0,
          rent_budget_tri: unit.rent_budget_tri ?? 0,
          lease_start: unit.lease_start ?? "",
          lease_end: unit.lease_end ?? null,
          tenant_name1: unit.tenant_name1 ?? "",
          tenant_name2: unit.tenant_name2 ?? "",
          unit_id: unit.unit_id ?? 0,
          unit_door: unit.unit_door ?? 0,
          unit_floor: unit.unit_floor ?? 0,
          tenant_number1: unit.tenant_number1 ?? 0,
          tenant_number2: unit.tenant_number2 ?? 0,
          units_status: unit.units_status ?? "vacant",
          tenant_mail1: unit.tenant_mail1 ?? "",
          tenant_mail2: unit.tenant_mail2 ?? "",
        };

        await prisma.rentRollUnit.create({ data: createData });
        result.inserted++;
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        unitId: unit.unit_id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}

export async function getAllRentRollUnits() {
  return prisma.rentRollUnit.findMany({
    orderBy: { unit_id: "asc" },
  });
}

export async function getRentRollUnitByUnitId(unitId: number) {
  return prisma.rentRollUnit.findUnique({
    where: { unit_id: unitId },
  });
}

export async function deleteRentRollUnit(unitId: number) {
  return prisma.rentRollUnit.delete({
    where: { unit_id: unitId },
  });
}
