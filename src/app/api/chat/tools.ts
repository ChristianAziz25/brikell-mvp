import { numericalQueryRAG } from "@/lib/rag/combinedRAG";
import { CoreMessage, tool, UIMessage } from "ai";
import { z } from "zod";
import { extractTextFromMessage } from "./utils/extractLatestMesaage";

/**
 * Factory that creates a Prisma-backed RAG tool bound to the current conversation.
 * The tool:
 * - Takes a natural language `userQuery`
 * - Runs the RAG + Prisma pipeline
 * - Returns JSON with `queryResults`, `tableDetailsText`, and `fewShotExamplesText`
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
      // Exclude the latest user message (the current question)
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
      "Use this tool whenever you need up-to-date numerical answers from the property database. " +
      "Provide the user's question as `userQuery`. The tool will run a Prisma query and return JSON: " +
      "`{ queryResults, tableDetailsText, fewShotExamplesText }`. After calling it, read that JSON " +
      "and answer the user in natural language without showing raw Prisma or JSON.",
    inputSchema: z.object({
      userQuery: z
        .string()
        .describe("The user's natural language question about the portfolio data."),
    }),
    execute: async ({ userQuery }) => {
      const {
        response,
        tableDetailsText,
        fewShotExamplesText,
      } = await numericalQueryRAG(userQuery, {
        tableLimit: 3,
        fewShotLimit: 4,
        conversationHistory,
      });

      return {
        userQuery,
        queryResults: response,
        tableDetailsText,
        fewShotExamplesText,
      };
    },
  });
};