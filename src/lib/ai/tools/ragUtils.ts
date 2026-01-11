import prisma from "@/lib/prisma/client";

/**
 * Clean and extract a single Prisma client call from code block or raw text.
 *
 * Goal: take messy model output and reduce it to something like:
 *   prisma.asset.findMany({ where: { ... } })
 */
export function cleanPrismaCodeBlock(raw: string): string {
  let cleaned = raw
    .replace(/```typescript/gi, "")
    .replace(/```ts/gi, "")
    .replace(/```javascript/gi, "")
    .replace(/```js/gi, "")
    .replace(/```/g, "")
    .trim();

  cleaned = cleaned
    .replace(
      /^export\s+(const|async\s+function|function)\s+\w+\s*=\s*/i,
      ""
    )
    .replace(/^const\s+\w+\s*=\s*/i, "")
    .replace(/^async\s+function\s+\w+\s*\([^)]*\)\s*\{?\s*/i, "")
    .replace(/^function\s+\w+\s*\([^)]*\)\s*\{?\s*/i, "")
    .replace(/^return\s+/i, "")
    .replace(/await\s+/gi, "")
    .replace(/;\s*$/, "")
    .replace(/\}\s*$/, "")
    .trim();

  const queryMatch = cleaned.match(/prisma\.\w+\.\w+\([\s\S]*\)/);
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
    console.log("🚀 [RAG] executing prisma query:", prismaQuery);
    const performanceStart = performance.now();
    const cleaned = cleanPrismaCodeBlock(prismaQuery);

    const match = cleaned.match(/^prisma\.(\w+)\.(\w+)\(([\s\S]*)\)$/);
    if (!match) {
      throw new Error(`Invalid Prisma query format: ${cleaned}`);
    }

    const [, modelName, method, argsStr] = match;

    const allowedMethods = new Set([
      "findUnique",
      "findUniqueOrThrow",
      "findFirst",
      "findFirstOrThrow",
      "findMany",
      "count",
      "aggregate",
      "groupBy",
    ]);

    if (!allowedMethods.has(method)) {
      throw new Error(
        `Disallowed Prisma method "${method}". Only read-only operations are permitted.`
      );
    }

    const model = (prisma as unknown as Record<string, unknown>)[
      modelName
    ] as Record<string, unknown>;
    if (!model) {
      throw new Error(`Model "${modelName}" not found in Prisma client`);
    }

    const queryMethod = model[method] as
      | ((args: unknown) => Promise<unknown>)
      | undefined;
    if (!queryMethod || typeof queryMethod !== "function") {
      throw new Error(
        `Method "${method}" not found on model "${modelName}"`,
      );
    }

    const args: unknown = eval(`(${argsStr})`);

    const result = await queryMethod(args);
    const performanceEnd = performance.now();
    console.log(
      "🚀 [RAG] prisma query executed in:",
      performanceEnd - performanceStart,
      "ms",
    );
    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to execute Prisma query: ${errorMessage}`);
  }
}

