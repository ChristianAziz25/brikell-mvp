import type { MyUIMessage } from "@/types/ChatMessage";
import { prisma } from "../client";

export async function createChat() {
  const chat = await prisma.chat.create({
    data: { chatMessages: { create: [] } },
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
 * Each ChatMessage row stores a single UIMessage JSON string for this chat.
 */
export async function loadChatHistory(
  chatId: string,
): Promise<MyUIMessage[]> {
  const rows = await prisma.chatMessage.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
  });

  const result: MyUIMessage[] = [];

  for (const row of rows) {
    if (!row.message) continue;
    try {
      result.push(JSON.parse(row.message) as MyUIMessage);
    } catch {
      // Skip malformed rows instead of breaking the entire history.
    }
  }

  return result;
}

/**
 * Persist full chat history (UIMessage[]) for a given chat into the database.
 * We keep one ChatMessage row per UI message (many ChatMessages per Chat).
 */

export async function createChatMessage(
  chatId: string,
  messages: MyUIMessage[],
): Promise<{ success: boolean }> {
  return saveChatHistory(chatId, messages);
}

export async function saveChatHistory(
  chatId: string,
  messages: MyUIMessage[],
): Promise<{ success: boolean }> {
  // Upsert one ChatMessage row per UI message, keyed by the UI message id.
  // This allows multiple ChatMessage rows per Chat over time without
  // deleting existing history.
  await prisma.$transaction(
    messages.map((msg) =>
      prisma.chatMessage.upsert({
        where: { id: msg.id },
        create: {
          id: msg.id,
          chatId,
          message: JSON.stringify(msg),
        },
        update: {
          message: JSON.stringify(msg),
        },
      }),
    ),
  );
  return { success: true };
}
