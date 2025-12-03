import { getAllRentRollUnits } from '@/lib/prisma/models/rentRollUnit';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const units = await getAllRentRollUnits();
    return NextResponse.json(units);
  } catch (error) {
    console.error('Error fetching rent roll data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rent roll data' },
      { status: 500 }
    );
  }
}