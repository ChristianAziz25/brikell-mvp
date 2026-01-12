import { getAllChats } from "@/lib/prisma/models/chat";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const chats = await getAllChats();
    
    // Transform chats to include preview text
    const chatsWithPreview = chats.map((chat) => {
      let preview = "";
      let firstUserMessage = "";
      
      for (const msg of chat.chatMessages) {
        try {
          const parsed = JSON.parse(msg.message);
          if (parsed.role === "user" && !firstUserMessage) {
            // Extract text from user message
            if (typeof parsed.content === "string") {
              firstUserMessage = parsed.content;
            } else if (Array.isArray(parsed.content)) {
              const textPart = parsed.content.find((p: { type?: string; text?: string }) => p.type === "text");
              firstUserMessage = textPart?.text || "";
            } else if (Array.isArray(parsed.parts)) {
              const textPart = parsed.parts.find((p: { type?: string; text?: string }) => p.type === "text");
              firstUserMessage = textPart?.text || "";
            }
          } else if (parsed.role === "assistant" && firstUserMessage && !preview) {
            // Extract preview from assistant response
            if (typeof parsed.content === "string") {
              preview = parsed.content;
            } else if (Array.isArray(parsed.content)) {
              const textPart = parsed.content.find((p: { type?: string; text?: string }) => p.type === "text");
              preview = textPart?.text || "";
            } else if (Array.isArray(parsed.parts)) {
              const textPart = parsed.parts.find((p: { type?: string; text?: string }) => p.type === "text");
              preview = textPart?.text || "";
            }
          }
        } catch {
          // Skip invalid messages
        }
      }
      
      return {
        id: chat.id,
        createdAt: chat.createdAt,
        title: firstUserMessage.slice(0, 100) || "New conversation",
        preview: preview.slice(0, 150) || "",
        messageCount: chat.chatMessages.length,
      };
    });
    
    // Filter out empty chats
    const nonEmptyChats = chatsWithPreview.filter(
      (chat) => chat.messageCount > 0
    );
    
    return NextResponse.json(nonEmptyChats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}
