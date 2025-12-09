import { openai } from "@ai-sdk/openai";
import { stepCountIs, streamText, type UIMessage } from "ai";
import { createPrismaQueryGenTool } from "./tools";
import { extractTextFromMessage } from "./utils/extractLatestMesaage";

export async function POST(req: Request) {
  try {
    const {
      messages,
    }: {
      messages: UIMessage[];
    } = await req.json();

    const prismaQueryGenTool = createPrismaQueryGenTool(messages);

    // Build CoreMessages from the UIMessage array
    const coreMessages = []

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
      messages: coreMessages,
      tools: { prismaQueryGenTool },
      toolChoice: "auto",
      stopWhen: stepCountIs(5)
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