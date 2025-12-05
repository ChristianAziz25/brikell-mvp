/**
 * Utility functions for RAG tools
 * Helper functions for Prisma query execution
 */

import prisma from '@/lib/prisma/client';

/**
 * Extracts the body content from a function definition by finding matching braces
 */
function extractFunctionBody(code: string, startIndex: number): string | null {
  let braceCount = 0;
  let bodyStart = -1;
  
  for (let i = startIndex; i < code.length; i++) {
    if (code[i] === '{') {
      if (braceCount === 0) {
        bodyStart = i + 1;
      }
      braceCount++;
    } else if (code[i] === '}') {
      braceCount--;
      if (braceCount === 0 && bodyStart !== -1) {
        return code.substring(bodyStart, i).trim();
      }
    }
  }
  
  return null;
}

/**
 * Cleans Prisma code block by removing markdown fences, comments, and function wrappers
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

  // Remove export statements if present (before checking for functions)
  code = code.replace(/^export\s+/gm, '').trim();

  // Check for function declarations and extract the body
  // Try each pattern and extract body if found, then break
  // Handle: async function name(prisma: ...) { ... }
  const asyncFunctionMatch = code.match(
    /async\s+function\s+\w+\s*\([^)]*\)\s*\{/
  );
  if (asyncFunctionMatch) {
    // Find the opening brace position (it's at the end of the match)
    const braceIndex = asyncFunctionMatch.index! + asyncFunctionMatch[0].length - 1;
    const body = extractFunctionBody(code, braceIndex);
    if (body) {
      code = body;
      return code;
    }
  }

  // Handle: function name(prisma: ...) { ... }
  const functionMatch = code.match(
    /function\s+\w+\s*\([^)]*\)\s*\{/
  );
  if (functionMatch) {
    // Find the opening brace position (it's at the end of the match)
    const braceIndex = functionMatch.index! + functionMatch[0].length - 1;
    const body = extractFunctionBody(code, braceIndex);
    if (body) {
      code = body;
      return code;
    }
  }

  // Handle: const name = async (prisma) => { ... }
  const arrowFunctionMatch = code.match(
    /const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{/
  );
  if (arrowFunctionMatch) {
    // Find the opening brace position (it's at the end of the match)
    const braceIndex = arrowFunctionMatch.index! + arrowFunctionMatch[0].length - 1;
    const body = extractFunctionBody(code, braceIndex);
    if (body) {
      code = body;
      return code;
    }
  }

  // Remove any remaining export statements
  code = code.replace(/^export\s+/gm, '').trim();

  return code;
}

/**
 * Executes a Prisma query from text by wrapping it in a function and executing it
 */
export async function executePrismaQueryFromText(
  prismaQuery: string,
): Promise<unknown> {
  const code = cleanPrismaCodeBlock(prismaQuery).trim();

  // Validate that we have code to execute
  if (!code || code.length === 0) {
    throw new Error('Empty Prisma query provided');
  }

  let body: string;

  // Check if code already has a return statement
  if (/\breturn\b/.test(code)) {
    body = code;
  } else {
    // Check if it's a const assignment
    const constMatch = code.match(/^const\s+(\w+)\s*=/);
    if (constMatch) {
      const varName = constMatch[1];
      body = `${code}\nreturn ${varName};`;
    } else if (/^prisma\./.test(code)) {
      // Direct Prisma query - wrap with return await
      body = `return await ${code};`;
    } else {
      // Fallback: wrap with return await
      body = `return await ${code};`;
    }
  }

  try {
    const wrapped = `"use strict"; return (async (prisma) => { ${body} })(prisma);`;
    const fn = new Function('prisma', wrapped);
    return await fn(prisma);
  } catch (error) {
    // Provide more context about the error
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to execute Prisma query: ${errorMessage}. Generated query: ${code.substring(0, 200)}${code.length > 200 ? '...' : ''}`
    );
  }
}

