import prisma from "@/lib/prisma/client";
import { RentStatus } from "../src/generated/enums";
import { rentRollData } from "./fakeData";

async function main() {
  // Clear existing data in correct FK order
  await prisma.rentRollUnit.deleteMany();
  await prisma.capex.deleteMany();
  await prisma.opex.deleteMany();
  await prisma.asset.deleteMany();

  const assetIdByPropertyName = new Map<string, string>();

  for (const unit of rentRollData) {
    const propertyName = unit.property_name;

    if (!assetIdByPropertyName.has(propertyName)) {
      const createdAsset = await prisma.asset.create({
        data: {
          name: propertyName,
          address: unit.unit_address,
          city: null,
          country: "Denmark",
        },
      });

      assetIdByPropertyName.set(propertyName, createdAsset.id);
    }

    const assetId = assetIdByPropertyName.get(propertyName)!;

    await prisma.rentRollUnit.create({
      data: {
        assetId,
        property_build_year: unit.property_build_year,
        property_name: unit.property_name,
        unit_address: unit.unit_address,
        unit_zipcode: String(unit.unit_zipcode),
        utilites_cost: unit.utilites_cost,
        unit_type: unit.unit_type,
        size_sqm: unit.size_sqm,
        rooms_amount: unit.rooms_amount,
        bedrooms_amount: unit.bedrooms_amount,
        bathrooms_amount: unit.bathrooms_amount,
        rent_current_gri: unit.rent_current_gri,
        rent_budget_tri: unit.rent_budget_tri,
        lease_start: unit.lease_start,
        lease_end: unit.lease_end || null,
        tenant_name1: unit.tenant_name1,
        tenant_name2: unit.tenant_name2,
        unit_id: unit.unit_id,
        unit_door: unit.unit_door,
        unit_floor: unit.unit_floor,
        tenant_number1: unit.tenant_number1,
        tenant_number2: unit.tenant_number2,
        units_status: unit.units_status as RentStatus,
        tenant_mail1: unit.tenant_mail1,
        tenant_mail2: unit.tenant_mail2,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


