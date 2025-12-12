import { saveChatHistory } from "@/lib/prisma/models/chat";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { chatId, messages } = await request.json();
  const response = await saveChatHistory(chatId, messages);

  console.log(response);
  if (!response.success) {
    return NextResponse.json({ error: "Failed to save chat history" }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 200 });
}