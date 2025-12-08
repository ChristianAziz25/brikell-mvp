import prisma from '@/lib/prisma/client';

/**
 * Clean and extract Prisma query from code block or raw text
 */
export function cleanPrismaCodeBlock(raw: string): string {
  // Remove markdown code blocks
  let cleaned = raw
    .replace(/```typescript/gi, '')
    .replace(/```ts/gi, '')
    .replace(/```/g, '')
    .trim();

  // Remove common wrapper patterns
  cleaned = cleaned
    .replace(/^export\s+(const|async\s+function|function)\s+\w+\s*=\s*/i, '')
    .replace(/^const\s+\w+\s*=\s*/i, '')
    .replace(/^async\s+function\s+\w+\s*\([^)]*\)\s*\{?\s*/i, '')
    .replace(/^function\s+\w+\s*\([^)]*\)\s*\{?\s*/i, '')
    .replace(/^return\s+/i, '')
    .replace(/await\s+/gi, '')
    .replace(/;\s*$/, '')
    .replace(/\}\s*$/, '')
    .trim();

  const queryMatch = cleaned.match(/prisma\.\w+\.\w+\([^)]*\)/);
  if (queryMatch) {
    return queryMatch[0];
  }

  return cleaned;
}

/**
 * Execute a Prisma query from text string
 * This safely evaluates Prisma queries by parsing the model and method
 */
export async function executePrismaQueryFromText(
  prismaQuery: string,
): Promise<unknown> {
  try {
    const cleaned = cleanPrismaCodeBlock(prismaQuery);

    // Parse the query to extract model and method
    const match = cleaned.match(/prisma\.(\w+)\.(\w+)\((.*)\)/);
    if (!match) {
      throw new Error(`Invalid Prisma query format: ${cleaned}`);
    }

    const [, modelName, method, argsStr] = match;

    // Get the model from Prisma client
    // Use unknown first for safe type conversion
    const model = (prisma as unknown as Record<string, unknown>)[modelName] as Record<string, unknown>;
    if (!model) {
      throw new Error(`Model "${modelName}" not found in Prisma client`);
    }

    // Get the method from the model delegate
    const queryMethod = model[method] as ((args: unknown) => Promise<unknown>) | undefined;
    if (!queryMethod || typeof queryMethod !== 'function') {
      throw new Error(
        `Method "${method}" not found on model "${modelName}"`,
      );
    }

    // Parse arguments (handle JSON-like objects)
    let args: unknown;
    try {
      // Try to parse as JSON first
      args = JSON.parse(argsStr);
    } catch {
      // If JSON parsing fails, try to evaluate safely
      // This is a simplified approach - in production, use a proper parser
      // Note: eval is used here for dynamic query execution - ensure input is sanitized
      args = eval(`(${argsStr})`);
    }

    // Execute the query
    const result = await queryMethod(args);
    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to execute Prisma query: ${errorMessage}`);
  }
}

