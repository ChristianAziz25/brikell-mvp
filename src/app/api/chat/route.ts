import type { MyUIMessage } from "@/types/ChatMessage";
import { openai } from "@ai-sdk/openai";
import { stepCountIs, streamText, type ModelMessage } from "ai";
import {
  createPrismaExecutionTool,
  createPrismaQueryGenTool,
} from "./tools";
import { extractTextFromMessage } from "./utils/extractLatestMesaage";

export async function POST(req: Request) {
  try {
    const {
      messages,
    }: {
      messages: MyUIMessage[];
    } = await req.json();

    const prismaQueryGenTool = createPrismaQueryGenTool(messages);
    const prismaExecutionTool = createPrismaExecutionTool();

    // Build CoreMessages from the UIMessage array
    const coreMessages = [
      {
        role: "system",
        content:
          "You are an expert TypeScript + Prisma assistant. " +
          "When constructing Prisma queries, only use models/fields from the provided schema. " +
          "For asset.name filters based on user text, prefer `where: { name: { contains: <text>, mode: \"insensitive\" } }` " +
          "so small typos and case differences still match." +
          `make sure the makeup of the final response is well formatted and easy to understand for the user.`
      },
    ];

    const CHAT_HISTORY_WINDOW_SIZE = 2;
    const chatHistoryWindow = messages.slice(-CHAT_HISTORY_WINDOW_SIZE);

    for (const msg of chatHistoryWindow) {
      if (msg.role === "user" || msg.role === "assistant") {
        const content = extractTextFromMessage(msg);
        coreMessages.push({
          role: msg.role,
          content,
        });
      }
    }

    const result = streamText({
      model: openai("gpt-5-nano"),
      messages: coreMessages as ModelMessage[],
      tools: {
        prismaQueryGenTool,
        prismaExecutionTool,
      },
      providerOptions: {
        openai: {
          reasoningEffort: 'low',        
        },
      },
      toolChoice: "auto",
      stopWhen: stepCountIs(5),
    });

    // Return a plain text streaming Response compatible with TextStreamChatTransport
    return result.toUIMessageStreamResponse({
      // Attach a numeric timestamp (ms since epoch) to each assistant message
      messageMetadata: () => ({
        createdAt: Date.now(),
      }),
    });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const errorObj = error as { message?: string };
    return new Response(
      JSON.stringify({
        error: errorObj?.message || "Failed to process chat request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}