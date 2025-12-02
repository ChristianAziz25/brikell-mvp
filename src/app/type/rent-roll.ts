export interface RentRollUnit {
    unit_Id: string;
    property_build_year: number;
    property_name: string;
    unit_address: string;
    unit_zipcode: string;
    unit_floor: string;
    unit_type: string;
    size_sqm: number;
    rooms_amount: number;
    bedrooms_amount: number;
    bathrooms_amount: number;
    rent_current_gri: number;
    rent_budget_tri: number;
    units_status: RentStatus;
    lease_start: string;
    lease_end: string;
    tenant_name1: string;
    tenant_name2: string;
    tenant_number1: string;
    tenant_number2: string;
    tenant_email1: string;
    tenant_email2: string;
    created_at: string;
    updated_at: string;
}

export type RentStatus = "occupied" | "vacant" | "terminated";
