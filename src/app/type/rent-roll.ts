export type RentStatus = "occupied" | "vacant" | "terminated";

// Frontend shape aligned with Prisma `RentRollUnit` model fields
// (see `prisma/schema.prisma` and `src/generated/models/RentRollUnit.ts`).
export interface RentRollUnit {
  property_build_year: number;
  property_name: string;
  unit_address: string;
  unit_zipcode: string;
  utilites_cost: number;
  unit_type: string;
  size_sqm: number;
  rooms_amount: number;
  bedrooms_amount: number;
  bathrooms_amount: number;
  rent_current_gri: number;
  rent_budget_tri: number;
  lease_start: string;
  lease_end: string | null;
  tenant_name1: string;
  tenant_name2: string;
  unit_id: number;
  unit_door: number;
  unit_floor: number;
  tenant_number1: number;
  tenant_number2: number;
  property_id: string | null;
  units_status: RentStatus;
  tenant_mail1: string;
  tenant_mail2: string;
}
