import { getRentRollUnitByUnitId } from '@/lib/prisma/models/rentRollUnit';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    const { unitId } = await params;
    const unitIdNumber = parseInt(unitId, 10);
    
    if (isNaN(unitIdNumber)) {
      return NextResponse.json(
        { error: 'Invalid unit ID' },
        { status: 400 }
      );
    }

    const unit = await getRentRollUnitByUnitId(unitIdNumber);
    
    if (!unit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(unit);
  } catch (error) {
    console.error('Error fetching rent roll unit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rent roll unit' },
      { status: 500 }
    );
  }
}

