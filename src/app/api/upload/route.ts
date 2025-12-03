import { RentRollUnitCreateInput } from '@/generated/models/RentRollUnit';
import { bulkUpsertRentRollUnits } from '@/lib/prisma/models/rentRollUnit';
import { NextRequest } from 'next/server';
import { extractDataWithLLM } from './aiExtraction';
import { parseFileToText } from './parsing';



export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return new Response('No file uploaded', { status: 400 });
  }

  const fileContent = await parseFileToText(file);
  const fileType = file.name.endsWith('.csv') ? 'csv' : file.name.endsWith('.xlsx') ? 'xlsx' : 'xls';
  
  const llmExtracted = await extractDataWithLLM(fileContent, fileType);
  
  const rentRollUnits = llmExtracted
    .filter((unit) => unit !== null) as RentRollUnitCreateInput[];
  
  const result = await bulkUpsertRentRollUnits(rentRollUnits);

  return new Response(JSON.stringify(result), { status: 200 });
}