import type { Prisma } from '@/generated/client';
import prisma from '@/lib/prisma/client';
import type { BulkInsertResult } from '../types';

// TODO: requires zod to runtime check types

export async function upsertRentRollUnit(data: Prisma.RentRollUnitCreateInput) {
  return prisma.rentRollUnit.upsert({
    where: { unit_id: data.unit_id },
    update: {
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
      tenant_email1: data.tenant_email1,
      tenant_email2: data.tenant_email2,
      updated_at: new Date(),
    },
    create: {
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
      tenant_email1: data.tenant_email1,
      tenant_email2: data.tenant_email2,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
}

export async function bulkUpsertRentRollUnits(
  data: Prisma.RentRollUnitCreateInput[]
): Promise<BulkInsertResult> {
  const result: BulkInsertResult = {
    success: true,
    inserted: 0,
    updated: 0,
    errors: [],
  };

  for (const unit of data) {
    try {
      const existing = await prisma.rentRollUnit.findUnique({
        where: { unit_id: unit.unit_id },
      });

      if (existing) {
        await prisma.rentRollUnit.update({
          where: { unit_id: unit.unit_id },
          data: {
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
            tenant_email1: unit.tenant_email1,
            tenant_email2: unit.tenant_email2,
            updated_at: new Date(),
          },
        });
        result.updated++;
      } else {
        await prisma.rentRollUnit.create({ data: unit });
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

export async function getAllRentRollUnits(): Promise<Prisma.RentRollUnitMinAggregateOutputType[]> {
  return prisma.rentRollUnit.findMany({
    orderBy: { created_at: 'desc' },
  });
}

export async function getRentRollUnitByUnitId(unitId: string) {
  return prisma.rentRollUnit.findUnique({
    where: { unit_id: unitId },
  });
}

export async function deleteRentRollUnit(unitId: string) {
  return prisma.rentRollUnit.delete({
    where: { unit_id: unitId },
  });
}
