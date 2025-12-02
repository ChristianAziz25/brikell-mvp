import type { Prisma } from '@/generated/client';
import { getAllRentRollUnits } from '@/lib/prisma/models/rent-roll';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const units = await getAllRentRollUnits();
    
    // Transform on server (better performance)
    const transformed: Prisma.RentRollUnitMinAggregateOutputType[] = units.map((unit) => ({
      unit_id: unit.unit_id,
      assetId: unit.assetId,
      property_build_year: unit.property_build_year,
      property_name: unit.property_name,
      unit_address: unit.unit_address,
      unit_zipcode: unit.unit_zipcode,
      unit_door: unit.unit_door,
      unit_floor: unit.unit_floor,
      utilites_cost: unit.utilites_cost,
      unit_type: unit.unit_type,
      size_sqm: unit.size_sqm,
      rooms_amount: unit.rooms_amount,
      bedrooms_amount: unit.bedrooms_amount,
      bathrooms_amount: unit.bathrooms_amount,
      rent_current_gri: unit.rent_current_gri,
      rent_budget_tri: unit.rent_budget_tri,
      units_status: unit.units_status,
      lease_start: unit.lease_start,
      lease_end: unit.lease_end,
      tenant_name1: unit.tenant_name1,
      tenant_name2: unit.tenant_name2,
      tenant_number1: unit.tenant_number1,
      tenant_number2: unit.tenant_number2,
      tenant_email1: unit.tenant_email1,
      tenant_email2: unit.tenant_email2,
      created_at: unit.created_at,
      updated_at: unit.updated_at,
    }));
  
    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching rent roll data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rent roll data' },
      { status: 500 }
    );
  }
}