import type { Prisma } from "@/generated/client";
import prisma from "@/lib/prisma/client";

interface BulkAssetResult {
  success: boolean;
  inserted: number;
  updated: number;
  errors: Array<{ assetIdOrName: string; error: string }>;
}

export async function upsertAsset(
  data: Prisma.AssetCreateInput & { id?: string }
) {
  if (data.id) {
    return prisma.asset.upsert({
      where: { id: data.id },
      update: {
        name: data.name,
        address: data.address,
        city: data.city,
        country: data.country,
      },
      create: data,
    });
  }

  return prisma.asset.upsert({
    where: { id: data.id ?? "" }, // will be ignored; we match by name using findFirst below if needed
    update: {
      name: data.name,
      address: data.address,
      city: data.city,
      country: data.country,
    },
    create: data,
  });
}

export async function bulkUpsertAssets(
  data: (Prisma.AssetCreateInput & { id?: string })[]
): Promise<BulkAssetResult> {
  const result: BulkAssetResult = {
    success: true,
    inserted: 0,
    updated: 0,
    errors: [],
  };

  for (const asset of data) {
    try {
      if (asset.id) {
        const existing = await prisma.asset.findUnique({
          where: { id: asset.id },
        });

        if (existing) {
          await prisma.asset.update({
            where: { id: asset.id },
            data: {
              name: asset.name,
              address: asset.address,
              city: asset.city,
              country: asset.country,
            },
          });
          result.updated++;
        } else {
          await prisma.asset.create({ data: asset });
          result.inserted++;
        }
      } else {
        const existingByName = await prisma.asset.findFirst({
          where: { name: asset.name },
        });

        if (existingByName) {
          await prisma.asset.update({
            where: { id: existingByName.id },
            data: {
              name: asset.name,
              address: asset.address,
              city: asset.city,
              country: asset.country,
            },
          });
          result.updated++;
        } else {
          await prisma.asset.create({ data: asset });
          result.inserted++;
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        assetIdOrName: asset.id ?? asset.name,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return result;
}

export async function getAllAssets() {
  return prisma.asset.findMany({
    orderBy: { name: "asc" },
    include: {
      capex: true,
      opex: true,
      rentRoll: true,
      tri: true,
    },
  });
}

export async function getAllAssetsNames() {
  return prisma.asset.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });
}

export async function getAssetById(id: string) {
  return prisma.asset.findUnique({
    where: { id },
    include: {
      capex: true,
      opex: true,
      rentRoll: true,
    },
  });
}

export async function getAllAssetsCapexOpexTri() {
  return prisma.asset.findMany({
    include: {
      capex: true,
      opex: true,
      tri: true,
      rentRoll: true,
    },
  });
}

export async function deleteAsset(id: string) {
  return prisma.asset.delete({
    where: { id },
  });
}


