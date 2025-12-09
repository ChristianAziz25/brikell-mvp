import { numericalQueryRAG } from "@/lib/rag/combinedRAG";
import { CoreMessage, tool, UIMessage } from "ai";
import { z } from "zod";
import { extractTextFromMessage } from "./utils/extractLatestMesaage";

export const createPrismaQueryGenTool = (messages: UIMessage[]) => {
    let latestUserMessage: UIMessage | undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === 'user') {
        latestUserMessage = messages[i];
        break;
      }
    }
    const conversationHistory: CoreMessage[] = messages
    .filter((msg) => {
      // Exclude the latest user message (we'll add it as the current query)
      if (msg === latestUserMessage) return false;
      // Only include user and assistant messages
      return msg.role === 'user' || msg.role === 'assistant';
    })
    .map((msg) => {
      const content = extractTextFromMessage(msg);
      return {
        role: msg.role as 'user' | 'assistant',
        content,
      };
    });
    return tool({
        description: 'ONLY use this tool to generate Prisma queries related to properties. Do not use this tool for other purposes.',
        inputSchema: z.object({
          userQuery: z.string(),
          messages: z.array(z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string(),
          })),
        }),
        execute: async ({ userQuery }) => {
            const {response, tableDetailsText, fewShotExamplesText} = await numericalQueryRAG(userQuery, {
              tableLimit: 3,
              fewShotLimit: 4,
              conversationHistory,
            });
            return {
              tableDetailsText,
              fewShotExamplesText,
              response,
            };
          },
        });
    }