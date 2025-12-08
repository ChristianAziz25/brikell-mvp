/**
 * Get Prisma schema description as a string for LLM prompts
 */
export function getPrismaSchema(): string {
  return `
Models and their fields:

Asset:
- id: String (primary key)
- name: String
- address: String? (optional)
- city: String? (optional)
- country: String? (optional)
- created_at: DateTime
- updated_at: DateTime
Relations: capex[], opex[], rentRoll[], tri[]

TheoreticalRentalIncome:
- id: String (primary key)
- assetId: String (foreign key to Asset)
- triYear: Int
- triAmount: Int
- vacancyLoss: Int
- createdAt: DateTime
- updatedAt: DateTime
Relations: asset (Asset)

Capex:
- id: String (primary key)
- asset_name: String
- capex_year: Int
- common_areas_actuals: Int
- units_renovations_actuals: Int
- elevator_maintnance_actuals: Int
- roof_maintnance_actuals: Int
- fire_safety_actuals: Int
- outdoor_area_actuals: Int
- common_areas_budget: Int
- units_renovations_budget: Int
- elevator_maintnance_budget: Int
- roof_maintnance_budget: Int
- fire_safety_budget: Int
- outdoor_area_budget: Int
- created_at: DateTime
- updated_at: DateTime
- assetId: String (foreign key to Asset)
Relations: asset (Asset)

Opex:
- id: String (primary key)
- asset_name: String
- opex_year: Int
- actual_delinquency: Int
- actual_property_management_fee: Int
- actual_leasing_fee: Int
- actual_property_taxes: Int
- actual_refuse_collection: Int
- actual_insurance: Int
- actual_cleaning: Int
- actual_facility_management: Int
- actual_service_subscriptions: Int
- actual_common_consumption: Int
- actual_home_owner_association: Int
- budget_delinquency: Int
- budget_property_management_fee: Int
- budget_leasing_fee: Int
- budget_property_taxes: Int
- budget_refuse_collection: Int
- budget_insurance: Int
- budget_cleaning: Int
- budget_facility_management: Int
- budget_service_subscriptions: Int
- budget_common_consumption: Int
- budget_home_owner_association: Int
- created_at: DateTime
- updated_at: DateTime
- assetId: String (foreign key to Asset)
Relations: asset (Asset)

RentRollUnit:
- assetId: String (foreign key to Asset)
- property_build_year: Int
- property_name: String
- unit_address: String
- unit_zipcode: String
- utilites_cost: Int
- unit_type: String
- size_sqm: Int
- rooms_amount: Int
- bedrooms_amount: Int
- bathrooms_amount: Int
- rent_current_gri: Int
- rent_budget_tri: Int
- lease_start: String
- lease_end: String? (optional)
- tenant_name1: String
- tenant_name2: String
- unit_id: Int (primary key)
- unit_door: Int
- unit_floor: Int
- tenant_number1: Int
- tenant_number2: Int
- units_status: RentStatus (enum: 'occupied' | 'vacant' | 'terminated')
- tenant_mail1: String
- tenant_mail2: String
- created_at: DateTime
- updated_at: DateTime
Relations: asset (Asset)
`;
}

