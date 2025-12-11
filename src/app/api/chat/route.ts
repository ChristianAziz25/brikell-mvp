import { openai } from "@ai-sdk/openai";
import { stepCountIs, streamText, type ModelMessage, type UIMessage } from "ai";
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
      messages: UIMessage[];
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
          "so small typos and case differences still match.",
      },
    ];

    for (const msg of messages) {
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
      toolChoice: "auto",
      stopWhen: stepCountIs(5),
    });

    // Return a plain text streaming Response compatible with TextStreamChatTransport
    return result.toUIMessageStreamResponse();
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