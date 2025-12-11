import { executePrismaQueryFromText } from "@/lib/ai/tools/ragUtils";
import { numericalQueryRAG } from "@/lib/rag/combinedRAG";
import { CoreMessage, tool, UIMessage } from "ai";
import { z } from "zod";
import { extractTextFromMessage } from "./utils/extractLatestMesaage";

/**
 * Tool 1: Fetch RAG context (table details, few-shot queries, schema)
 * -------------------------------------------------------------------
 * Takes a natural language `userQuery`, runs embeddings + Supabase hybrid
 * search, and returns *only* structured context (no inner LLM, no DB exec).
 *
 * The model should:
 * - Call this tool to get `{ userQuery, tableDetailsText, fewShotExamplesText, schema }`
 * - Use that to write Prisma queries and reason about the data
 */
export const createPrismaQueryGenTool = (messages: UIMessage[]) => {
  // Derive conversation history (everything except the latest user message)
  let latestUserMessage: UIMessage | undefined;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") {
      latestUserMessage = messages[i];
      break;
    }
  }

  const conversationHistory: CoreMessage[] = messages
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
      "Use this tool to fetch database context for numerical questions. " +
      "Provide the user's question as `userQuery`. The tool will return JSON: " +
      "`{ userQuery, tableDetailsText, fewShotExamplesText, schema }`. " +
      "Use this information to construct Prisma queries and reason about the data; " +
      "this tool itself does not execute Prisma.",
    inputSchema: z.object({
      userQuery: z
        .string()
        .describe("The user's natural language question about the portfolio data."),
    }),
    execute: async ({ userQuery }) => {
      const { tableDetailsText, fewShotExamplesText, schema } =
        await numericalQueryRAG(userQuery, {
          tableLimit: 3,
          fewShotLimit: 2,
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
 * Tool 2: Execute a Prisma query string and return live DB results.
 * ----------------------------------------------------------------
 * The model should:
 * - First decide on a concrete Prisma client call (e.g. prisma.asset.findMany({...}))
 * - Call this tool with `prismaQuery`
 * - Then read the `result` and explain it to the user in natural language.
 */
export const createPrismaExecutionTool = () =>
  tool({
    description:
      "Execute a Prisma query string against the live database and return JSON results. " +
      "Use this after you've constructed a safe Prisma client call. " +
      "Only use read-only operations like findUnique/findMany/count for now.",
    inputSchema: z.object({
      prismaQuery: z
        .string()
        .describe(
          'A single Prisma client call, e.g. `prisma.asset.findMany({ where: { name: "Gertrudehus" } })`.'
        ),
    }),
    execute: async ({ prismaQuery }) => {
      const result = await executePrismaQueryFromText(prismaQuery);
      return {
        prismaQuery,
        result,
      };
    },
  });