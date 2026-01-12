import { prisma } from "@/lib/prisma";
import { numericalQueryRAG } from "@/lib/rag/combinedRAG";
import { CoreMessage, tool, UIMessage } from "ai";
import { z } from "zod";
import { extractTextFromMessage } from "./utils/extractLatestMesaage";

/**
 * SQL Query Validation - First Layer of Defense
 * Validates that SQL queries are safe SELECT-only statements
 */
function validateSQLQuery(sql: string): { valid: boolean; error?: string } {
  const trimmedSQL = sql.trim().toLowerCase();
  
  if (!trimmedSQL.startsWith('select')) {
    return { valid: false, error: 'Query must be a SELECT statement' };
  }
  
  const dangerousKeywords = [
    'drop', 'delete', 'insert', 'update', 'alter', 'create',
    'truncate', 'exec', 'execute', 'grant', 'revoke', 'merge',
    'replace', 'call', 'commit', 'rollback', 'savepoint',
    'set transaction', 'lock', 'unlock'
  ];
  
  for (const keyword of dangerousKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(trimmedSQL)) {
      return { valid: false, error: `Forbidden keyword detected: ${keyword.toUpperCase()}` };
    }
  }
  
  if (trimmedSQL.includes(';')) {
    return { valid: false, error: 'Multiple statements not allowed (semicolon detected)' };
  }
  
  if (trimmedSQL.includes('--') || trimmedSQL.includes('/*')) {
    return { valid: false, error: 'SQL comments not allowed' };
  }
  
  return { valid: true };
}

/**
 * Tool 1: Fetch RAG context and generate SQL query
 * -------------------------------------------------------------------
 * Takes a natural language `userQuery`, runs embeddings + Supabase hybrid
 * search, and returns structured context for SQL generation.
 *
 * The model should:
 * - Call this tool to get `{ userQuery, tableDetailsText, fewShotExamplesText, schema }`
 * - Use that to write SAFE, READ-ONLY SQL SELECT queries ONLY
 * - Never generate INSERT, UPDATE, DELETE, DROP or any other modification queries
 */
export const createSQLQueryGenTool = (messages: UIMessage[]) => {
  let latestUserMessage: UIMessage | undefined;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") {
      latestUserMessage = messages[i];
      break;
    }
  }

  const HISTORY_WINDOW_SIZE = 5;
  const historyWindow = messages.slice(-HISTORY_WINDOW_SIZE);

  const conversationHistory: CoreMessage[] = historyWindow
    .filter((msg) => {
      if (msg === latestUserMessage) return false;
      return msg.role === "user" || msg.role === "assistant";
    })
    .map((msg) => {
      const content = extractTextFromMessage(msg);
      return {
        role: msg.role as "user" | "assistant",
        content,
      };
    });

  return tool({
    description:
      "🔒 CRITICAL SECURITY REQUIREMENT: This tool is for generating READ-ONLY SQL SELECT queries ONLY.\n\n" +
      "STRICT RULES YOU MUST FOLLOW:\n" +
      "1. ONLY generate SELECT statements - NEVER use INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, EXEC, EXECUTE, GRANT, or any other modification keywords\n" +
      "2. Use PostgreSQL syntax with proper schema qualification (e.g., SELECT * FROM public.asset)\n" +
      "3. Use parameterization-safe patterns - avoid string concatenation in WHERE clauses\n" +
      "4. Always validate table/column names against the provided schema\n" +
      "5. Use LIMIT clauses to prevent accidentally returning too much data\n" +
      "6. For text searches, use ILIKE with proper quoting: WHERE name ILIKE '%search%'\n" +
      "7. Never include comments (-- or /* */) in the SQL\n" +
      "8. Never chain multiple statements with semicolons\n\n" +
      "Provide the user's question as `userQuery`. The tool will return:\n" +
      "`{ userQuery, tableDetailsText, fewShotExamplesText, schema }`\n" +
      "Use this information to construct a SAFE, READ-ONLY SELECT query.",
    inputSchema: z.object({
      userQuery: z
        .string()
        .describe("The user's natural language question about the portfolio data."),
    }),
    execute: async ({ userQuery }) => {
      const { tableDetailsText, fewShotExamplesText, schema } =
        await numericalQueryRAG(userQuery, {
          tableLimit: 1,  // Reduced from 2 for faster search
          fewShotLimit: 1, // Reduced from 2 for faster search
          conversationHistory,
        });

      return {
        userQuery,
        tableDetailsText,
        fewShotExamplesText,
        schema,
      };
    },
  });
};

/**
 * Tool 2: Execute a validated SQL query and return live DB results.
 * ------------------------------------------------------------------
 * SECOND LAYER OF DEFENSE: Validates SQL before execution
 * 
 * The model should:
 * - First construct a safe SELECT query based on the schema
 * - Call this tool with `sqlQuery`
 * - The tool will validate the query for safety before execution
 * - Then read the `result` and explain it to the user in natural language.
 */
// Query timeout helper
const QUERY_TIMEOUT_MS = 8000; // 8 seconds max

async function executeWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

export const createSQLExecutionTool = () =>
  tool({
    description:
      "🔒 Execute a validated READ-ONLY SQL SELECT query against the live database.\n\n" +
      "SECURITY: This tool performs automatic validation:\n" +
      "- Only SELECT statements are allowed\n" +
      "- Dangerous keywords (DROP, DELETE, UPDATE, etc.) are blocked\n" +
      "- Query chaining (semicolons) is blocked\n" +
      "- SQL comments are blocked\n\n" +
      "Use this after you've constructed a safe SELECT query from the schema context.\n" +
      "Example: SELECT * FROM public.asset WHERE name ILIKE '%Gertrudehus%' LIMIT 10",
    inputSchema: z.object({
      sqlQuery: z
        .string()
        .describe(
          'A safe, read-only SQL SELECT statement. Must use PostgreSQL syntax with proper schema qualification.'
        ),
    }),
    execute: async ({ sqlQuery }) => {
      const validation = validateSQLQuery(sqlQuery);
      
      if (!validation.valid) {
        return {
          sqlQuery,
          error: `🚫 SQL Validation Failed: ${validation.error}`,
          result: null,
        };
      }
      
      try {
        // Execute with timeout to prevent slow queries from blocking
        const result = await executeWithTimeout(
          prisma.$queryRawUnsafe(sqlQuery),
          QUERY_TIMEOUT_MS
        );
        
        const serializedResult = JSON.parse(
          JSON.stringify(result, (_, value) =>
            typeof value === 'bigint' ? value.toString() : value
          )
        );
        
        return {
          sqlQuery,
          result: serializedResult,
          rowCount: Array.isArray(serializedResult) ? serializedResult.length : 1,
        };
      } catch (error) {
        console.error('SQL Execution Error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isTimeout = errorMessage.includes('timeout');
        return {
          sqlQuery,
          error: isTimeout 
            ? `⏱️ Query took too long. Try adding more filters or LIMIT clause.`
            : `Database error: ${errorMessage}`,
          result: null,
        };
      }
    },
  });