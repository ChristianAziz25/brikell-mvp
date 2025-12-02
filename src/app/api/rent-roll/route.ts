import { getAllRentRollUnits } from '@/lib/prisma/models/rent-roll';
import { NextResponse } from 'next/server';

type RentRollUnitResponse = {
  unitId: string;
  propertyYear: number;
  propertyName: string;
  unitAddress: string;
  zipcode: string;
  floor: string;
  unitType: string;
  size: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  rentCurrent: number;
  rentBudget: number;
  status: 'occupied' | 'vacant' | 'terminated';
  leaseStart: string;
  leaseEnd: string;
  tenantName: string;
};

export async function GET() {
  try {
    const units = await getAllRentRollUnits();
    
    // Transform on server (better performance)
    const transformed: RentRollUnitResponse[] = units.map((unit) => ({
      unitId: unit.unitId,
      propertyYear: unit.propertyYear,
      propertyName: unit.propertyName,
      unitAddress: unit.address,
      zipcode: unit.zipcode,
      floor: unit.floor,
      unitType: unit.size,
      size: parseFloat(unit.size) || 0,
      rooms: unit.rooms,
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      rentCurrent: unit.monthlyRent,
      rentBudget: unit.contractedRent,
      status: unit.occupancyStatus,
      leaseStart: unit.leaseStart.toISOString(),
      leaseEnd: unit.leaseEnd.toISOString(),
      tenantName: unit.tenantName,
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