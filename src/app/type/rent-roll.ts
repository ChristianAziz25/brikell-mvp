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
  units_status: RentStatus;
  tenant_mail1: string;
  tenant_mail2: string;
}

export enum RentRollField {
  unit_id = "unit_id",
  property_build_year = "property_build_year",
  property_name = "property_name",
  unit_address = "unit_address",
  unit_zipcode = "unit_zipcode",
  unit_door = "unit_door",
  unit_floor = "unit_floor",
  unit_type = "unit_type",
  units_status = "units_status",
  utilites_cost = "utilites_cost",
  size_sqm = "size_sqm",
  rooms_amount = "rooms_amount",
  bedrooms_amount = "bedrooms_amount",
  bathrooms_amount = "bathrooms_amount",
  rent_current_gri = "rent_current_gri",
  rent_budget_tri = "rent_budget_tri",
  lease_start = "lease_start",
  lease_end = "lease_end",
  tenant_name1 = "tenant_name1",
  tenant_name2 = "tenant_name2",
  tenant_number1 = "tenant_number1",
  tenant_number2 = "tenant_number2",
  tenant_mail1 = "tenant_mail1",
  tenant_mail2 = "tenant_mail2",
  rent_erv_tri = "ERV/TRI",
}
