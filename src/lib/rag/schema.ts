/**
 * Get Prisma schema description as a string for LLM prompts
 */
export function getPrismaSchema(): string {
  return `
Models and their fields (names and relations only):

Asset:
- Fields: id, name, address, city, country, created_at, updated_at
- Relations: capex[], opex[], rentRoll[], tri[]

TheoreticalRentalIncome:
- Fields: id, assetId, triYear, triAmount, vacancyLoss, createdAt, updatedAt
- Relations: asset (Asset)

Capex:
- Fields: id, asset_name, capex_year, common_areas_actuals, units_renovations_actuals,
  elevator_maintnance_actuals, roof_maintnance_actuals, fire_safety_actuals,
  outdoor_area_actuals, common_areas_budget, units_renovations_budget,
  elevator_maintnance_budget, roof_maintnance_budget, fire_safety_budget,
  outdoor_area_budget, created_at, updated_at, assetId
- Relations: asset (Asset)

Opex:
- Fields: id, asset_name, opex_year, actual_delinquency, actual_property_management_fee,
  actual_leasing_fee, actual_property_taxes, actual_refuse_collection,
  actual_insurance, actual_cleaning, actual_facility_management,
  actual_service_subscriptions, actual_common_consumption,
  actual_home_owner_association, budget_delinquency,
  budget_property_management_fee, budget_leasing_fee, budget_property_taxes,
  budget_refuse_collection, budget_insurance, budget_cleaning,
  budget_facility_management, budget_service_subscriptions,
  budget_common_consumption, budget_home_owner_association,
  created_at, updated_at, assetId
- Relations: asset (Asset)

RentRollUnit:
- Fields: assetId, property_build_year, property_name, unit_address, unit_zipcode,
  utilites_cost, unit_type, size_sqm, rooms_amount, bedrooms_amount,
  bathrooms_amount, rent_current_gri, rent_budget_tri, lease_start,
  lease_end, tenant_name1, tenant_name2, unit_id, unit_door, unit_floor,
  tenant_number1, tenant_number2, units_status, tenant_mail1, tenant_mail2,
  created_at, updated_at
- Relations: asset (Asset)
`;
}

