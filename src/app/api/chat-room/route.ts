import { createChat, getChat } from "@/lib/prisma/models/chat";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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
  return NextResponse.json(chat);
}