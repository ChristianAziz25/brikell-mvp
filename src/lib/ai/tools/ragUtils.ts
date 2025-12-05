/**
 * Utility functions for RAG tools
 * Helper functions for Prisma query execution
 */

import prisma from '@/lib/prisma/client';

/**
 * Cleans Prisma code block by removing markdown fences and comments
 */
export function cleanPrismaCodeBlock(raw: string): string {
  let code = raw.trim();

  // If the model wrapped the query in a fenced code block, extract the inner content
  const fenceMatch = code.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
  if (fenceMatch && fenceMatch[1]) {
    code = fenceMatch[1].trim();
  }

  // Drop a leading comment line like "// TypeScript / Prisma Client code here"
  code = code.replace(/^\/\/.*$/m, '').trim();

  return code;
}

/**
 * Executes a Prisma query from text by wrapping it in a function and executing it
 */
export async function executePrismaQueryFromText(
  prismaQuery: string,
): Promise<unknown> {
  const code = cleanPrismaCodeBlock(prismaQuery).trim();

  let body: string;

  if (/\breturn\b/.test(code)) {
    body = code;
  } else {
    const constMatch = code.match(/^const\s+(\w+)\s*=/);
    if (constMatch) {
      const varName = constMatch[1];
      body = `${code}\nreturn ${varName};`;
    } else if (/^prisma\./.test(code)) {
      body = `return await (${code});`;
    } else {
      body = `return await (${code});`;
    }
  }

  const wrapped = `"use strict"; return (async (prisma) => { ${body} })(prisma);`;
  const fn = new Function('prisma', wrapped);
  return await fn(prisma);
}

