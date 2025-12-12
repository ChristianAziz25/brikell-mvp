import { createChat, getChat } from "@/lib/prisma/models/chat";
import { NextRequest, NextResponse } from "next/server";


interface Message {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  message: string;
  chatId: string;
}

export interface Chat {
  createdAt: Date;
  id: string;
  updatedAt: Date;
  chatMessages: Message[];
}

export async function POST(): Promise<NextResponse<{ id: string }>> {
  const chat = await createChat();
  console.log("Created chat", chat);
  return NextResponse.json({ id: chat.id }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");
  if (!chatId) {
    return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
  }
  const chat = await getChat(chatId);
  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }
  return NextResponse.json(chat);
}