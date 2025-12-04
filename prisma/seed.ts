import prisma from "@/lib/prisma/client";
import { RentStatus } from "../src/generated/enums";
import {
  capexData,
  opexData,
  rentRollData,
  theoreticalRentalIncData,
} from "./fakeData";

async function main() {
  // Clear existing data in correct FK order
  await prisma.rentRollUnit.deleteMany();
  await prisma.capex.deleteMany();
  await prisma.opex.deleteMany();
  await prisma.asset.deleteMany();

  const assetIdByName = new Map<string, string>();

  // Seed assets + rent roll
  for (const unit of rentRollData) {
    const propertyName = unit.property_name;

    if (!assetIdByName.has(propertyName)) {
      const createdAsset = await prisma.asset.create({
        data: {
          name: propertyName,
          address: unit.unit_address,
          city: null,
          country: "Denmark",
        },
      });

      assetIdByName.set(propertyName, createdAsset.id);
    }

    const assetId = assetIdByName.get(propertyName)!;

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

  // Ensure assets exist for capex / opex only names
  for (const row of capexData) {
    if (!assetIdByName.has(row.asset_name)) {
      const createdAsset = await prisma.asset.create({
        data: {
          name: row.asset_name,
          address: null,
          city: null,
          country: "Denmark",
        },
      });
      assetIdByName.set(row.asset_name, createdAsset.id);
    }
  }

  for (const row of opexData) {
    if (!assetIdByName.has(row.asset_name)) {
      const createdAsset = await prisma.asset.create({
        data: {
          name: row.asset_name,
          address: null,
          city: null,
          country: "Denmark",
        },
      });
      assetIdByName.set(row.asset_name, createdAsset.id);
    }
  }

  // Seed Capex
  for (const row of capexData) {
    const assetId = assetIdByName.get(row.asset_name);
    if (!assetId) continue;

    await prisma.capex.create({
      data: {
        assetId,
        asset_name: row.asset_name,
        capex_year: row.capex_year,
        common_areas_actuals: row.common_areas_actuals,
        units_renovations_actuals: row.units_renovations_actuals,
        elevator_maintnance_actuals: row.elevator_maintnance_actuals,
        roof_maintnance_actuals: row.roof_maintnance_actuals,
        fire_safety_actuals: row.fire_safety_actuals,
        outdoor_area_actuals: row.outdoor_area_actuals,
        common_areas_budget: row.common_areas_budget,
        units_renovations_budget: row.units_renovations_budget,
        elevator_maintnance_budget: row.elevator_maintnance_budget,
        roof_maintnance_budget: row.roof_maintnance_budget,
        fire_safety_budget: row.fire_safety_budget,
        outdoor_area_budget: row.outdoor_area_budget,
      },
    });
  }

  // Seed Opex
  for (const row of opexData) {
    const assetId = assetIdByName.get(row.asset_name);
    if (!assetId) continue;

    await prisma.opex.create({
      data: {
        assetId,
        asset_name: row.asset_name,
        opex_year: row.opex_year,
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
  }

  // Seed Theoretical Rental Income (TRI) using the static fake data
  // The data in `theoreticalRentalIncData` is already varied to look realistic,
  // so we just insert it as-is.
  for (const row of theoreticalRentalIncData) {
    const assetId = assetIdByName.get(row.asset_name);
    if (!assetId) continue;

    await prisma.theoreticalRentalIncome.create({
      data: {
        assetId,
        triYear: row.tri_year,
        triAmount: row.tri_amount,
        vacancyLoss: row.vacancy_loss,
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


