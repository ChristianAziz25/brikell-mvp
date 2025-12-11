import type { MyUIMessage } from "@/types/ChatMessage";
import { prisma } from "../client";

export async function createChat() {
  const id = crypto.randomUUID();
  const chat = await prisma.chat.create({
    data: { id, chatMessages: { create: [] } },
  });
  return chat;
}

export async function getChat(id: string) {
  return prisma.chat.findUnique({
    where: { id },
    include: { chatMessages: true },
  });
}

/**
 * Load full chat history for a given chat from the database.
 * We store the entire UIMessage[] JSON in the single ChatMessage row for this chat.
 */
export async function loadChatHistory(
  chatId: string,
): Promise<MyUIMessage[]> {
  const row = await prisma.chatMessage.findUnique({
    where: { chatId },
  });

  if (!row?.message) return [];

  try {
    return JSON.parse(row.message) as MyUIMessage[];
  } catch {
    // If parsing fails, treat as no history rather than breaking the chat.
    return [];
  }
}

/**
 * Persist full chat history (UIMessage[]) for a given chat into the database.
 * Uses a single ChatMessage row per chat (chatId is unique) with JSON-encoded messages.
 */
export async function saveChatHistory(
  chatId: string,
  messages: MyUIMessage[],
): Promise<void> {
  const payload = JSON.stringify(messages);

  await prisma.chatMessage.upsert({
    where: { chatId },
    create: {
      chatId,
      message: payload,
    },
    update: {
      message: payload,
    },
  });
}
