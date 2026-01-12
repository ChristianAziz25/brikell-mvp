import { prisma } from "@/lib/prisma";

/**
 * Generate realistic BBR data based on address
 */
export function generateMockBBRData(address: string, zipCode: string) {
  // Extract city from zip code ranges
  const cityMap: Record<string, string> = {
    "1000": "Copenhagen",
    "2000": "Frederiksberg",
    "2100": "Copenhagen",
    "2200": "Copenhagen",
    "2300": "Copenhagen",
    "8000": "Aarhus",
    "8700": "Horsens",
    "9000": "Aalborg",
  };

  const city = cityMap[zipCode] || "Copenhagen";
  
  // Generate realistic values based on address hash
  const addressHash = address.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = addressHash % 1000;
  
  // Property values range from 5M to 50M DKK
  const baseValue = 5000000 + (seed * 45000);
  const propertyValue = Math.round(baseValue / 1000) * 1000;
  const landValue = Math.round(propertyValue * 0.2);
  
  // Building year between 1950-2020
  const buildingYear = 1950 + (seed % 70);
  
  // Area calculations
  const totalArea = 2000 + (seed * 10);
  const residentialArea = Math.round(totalArea * 0.8);
  const commercialArea = totalArea - residentialArea;
  
  // Energy labels
  const energyLabels = ["A", "B", "C", "D", "E"];
  const energyLabel = energyLabels[seed % 5];
  
  return {
    address,
    zipCode,
    city,
    buildingYear,
    totalArea: parseFloat(totalArea.toFixed(2)),
    residentialArea: parseFloat(residentialArea.toFixed(2)),
    commercialArea: parseFloat(commercialArea.toFixed(2)),
    energyLabel,
    propertyValue: parseFloat(propertyValue.toFixed(2)),
    landValue: parseFloat(landValue.toFixed(2)),
    bbrNumber: `BBR-${zipCode}-${Math.abs(addressHash).toString().padStart(6, "0")}`,
    lastUpdated: new Date(),
  };
}

/**
 * Generate realistic OIS data
 */
export function generateMockOISData(address: string, zipCode: string) {
  const addressHash = address.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = addressHash % 100;
  
  const ownerTypes = ["Private", "Company", "Foundation", "Municipality"];
  const propertyTypes = ["Residential", "Commercial", "Mixed", "Industrial"];
  
  const cityMap: Record<string, string> = {
    "1000": "Copenhagen",
    "2000": "Frederiksberg",
    "2100": "Copenhagen",
    "2200": "Copenhagen",
    "2300": "Copenhagen",
    "8000": "Aarhus",
    "8700": "Horsens",
    "9000": "Aalborg",
  };
  
  return {
    address,
    zipCode,
    city: cityMap[zipCode] || "Copenhagen",
    ownerName: `Owner ${seed}`,
    ownerType: ownerTypes[seed % 4],
    propertyType: propertyTypes[seed % 4],
    registrationDate: new Date(2020 + (seed % 5), 0, 1),
    lastUpdated: new Date(),
  };
}

/**
 * Generate realistic EJF data
 */
export function generateMockEJFData(address: string, zipCode: string, year: number) {
  const addressHash = address.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = (addressHash + year) % 1000;
  
  // Assessed value (typically 80-120% of market value)
  const baseAssessed = 8000000 + (seed * 40000);
  const assessedValue = Math.round(baseAssessed * (0.8 + (seed % 40) / 100));
  
  // Tax base (typically 80% of assessed value)
  const taxBase = Math.round(assessedValue * 0.8);
  
  // Property tax (typically 1-1.5% of tax base)
  const propertyTax = Math.round(taxBase * (0.01 + (seed % 5) / 1000));
  
  const cityMap: Record<string, string> = {
    "1000": "Copenhagen",
    "2000": "Frederiksberg",
    "2100": "Copenhagen",
    "2200": "Copenhagen",
    "2300": "Copenhagen",
    "8000": "Aarhus",
    "8700": "Horsens",
    "9000": "Aalborg",
  };
  
  return {
    address,
    zipCode,
    city: cityMap[zipCode] || "Copenhagen",
    assessedValue: parseFloat(assessedValue.toFixed(2)),
    taxBase: parseFloat(taxBase.toFixed(2)),
    propertyTax: parseFloat(propertyTax.toFixed(2)),
    year,
    lastUpdated: new Date(),
  };
}

/**
 * Seed mock data for all existing assets
 */
export async function seedMockDataForAssets() {
  const assets = await prisma.asset.findMany({
    where: {
      address: { not: null },
    },
  });

  const results = [];

  for (const asset of assets) {
    if (!asset.address) continue;

    // Extract zip code from address or use default
    const zipMatch = asset.address.match(/\b(\d{4})\b/);
    const zipCode = zipMatch ? zipMatch[1] : "1000";

    try {
      // Generate and upsert BBR data
      const bbrData = generateMockBBRData(asset.address, zipCode);
      const bbrRecord = await prisma.bBRData.upsert({
        where: { bbrNumber: bbrData.bbrNumber },
        update: {
          ...bbrData,
          propertyId: asset.id,
        },
        create: {
          ...bbrData,
          propertyId: asset.id,
        },
      });

      // Generate and upsert OIS data
      const oisData = generateMockOISData(asset.address, zipCode);
      const existingOIS = await prisma.oISData.findFirst({
        where: {
          address: { contains: asset.address, mode: "insensitive" },
          zipCode,
        },
      });

      const oisRecord = existingOIS
        ? await prisma.oISData.update({
            where: { id: existingOIS.id },
            data: { ...oisData, propertyId: asset.id },
          })
        : await prisma.oISData.create({
            data: { ...oisData, propertyId: asset.id },
          });

      // Generate EJF data for last 3 years
      const currentYear = new Date().getFullYear();
      const ejfRecords = [];
      for (let year = currentYear - 2; year <= currentYear; year++) {
        const ejfData = generateMockEJFData(asset.address, zipCode, year);
        const ejfRecord = await prisma.eJFData.upsert({
          where: {
            ejf_address_zip_year: {
              address: asset.address,
              zipCode,
              year,
            },
          },
          update: {
            ...ejfData,
            propertyId: asset.id,
          },
          create: {
            ...ejfData,
            propertyId: asset.id,
          },
        });
        ejfRecords.push(ejfRecord);
      }

      results.push({
        asset: asset.name,
        bbr: bbrRecord.id,
        ois: oisRecord.id,
        ejf: ejfRecords.length,
      });
    } catch (error) {
      console.error(`Error seeding data for ${asset.name}:`, error);
    }
  }

  return results;
}
