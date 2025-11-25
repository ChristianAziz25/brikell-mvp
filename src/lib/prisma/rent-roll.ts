import prisma from './client';
import type { BulkInsertResult, RentRollUnit, RentRollUnitInput } from './types';

export async function upsertRentRollUnit(data: RentRollUnitInput) {
  return prisma.rentRollUnit.upsert({
    where: { unitId: data.unitId },
    update: {
      propertyYear: data.propertyYear,
      propertyName: data.propertyName,
      address: data.address,
      zipcode: data.zipcode,
      size: data.size,
      rooms: data.rooms,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      floor: data.floor,
      monthlyRent: data.monthlyRent,
      contractedRent: data.contractedRent,
      occupancyStatus: data.occupancyStatus,
      leaseStart: data.leaseStart,
      leaseEnd: data.leaseEnd,
      tenantName: data.tenantName,
      updatedAt: new Date(),
    },
    create: data,
  });
}

export async function bulkUpsertRentRollUnits(
  data: RentRollUnitInput[]
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
        where: { unitId: unit.unitId },
      });

      if (existing) {
        await prisma.rentRollUnit.update({
          where: { unitId: unit.unitId },
          data: {
            propertyYear: unit.propertyYear,
            propertyName: unit.propertyName,
            address: unit.address,
            zipcode: unit.zipcode,
            size: unit.size,
            rooms: unit.rooms,
            bedrooms: unit.bedrooms,
            bathrooms: unit.bathrooms,
            floor: unit.floor,
            monthlyRent: unit.monthlyRent,
            contractedRent: unit.contractedRent,
            occupancyStatus: unit.occupancyStatus,
            leaseStart: unit.leaseStart,
            leaseEnd: unit.leaseEnd,
            tenantName: unit.tenantName,
            updatedAt: new Date(),
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
        unitId: unit.unitId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}

export async function getAllRentRollUnits(): Promise<RentRollUnit[]> {
  return prisma.rentRollUnit.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function getRentRollUnitByUnitId(unitId: string) {
  return prisma.rentRollUnit.findUnique({
    where: { unitId },
  });
}

export async function deleteRentRollUnit(unitId: string) {
  return prisma.rentRollUnit.delete({
    where: { unitId },
  });
}
