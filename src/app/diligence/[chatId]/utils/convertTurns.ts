import { extractTextFromMessage } from "@/app/api/chat/utils/extractLatestMesaage";
import type { MyUIMessage } from "@/types/ChatMessage";

export type Turn = {
  user: string;
  assistant: string;
};

export function getConversationTurns(messages: MyUIMessage[]): Turn[] {
  const turns: Turn[] = [];
  let pendingUser: string | null = null;

  for (const msg of messages) {
    if (msg.role === "user") {
      // start a new user query
      pendingUser = extractTextFromMessage(msg);
    } else if (msg.role === "assistant" && pendingUser) {
      // pair this assistant reply with the last user query
      const assistantText = extractTextFromMessage(msg);
      turns.push({ user: pendingUser, assistant: assistantText });
      pendingUser = null;
    }
  }

  return turns;
}

export function getLastTurn(messages: MyUIMessage[]): Turn | null {
    const turns = getConversationTurns(messages);
    if (turns.length === 0) return null;
    return turns[turns.length - 1];
  }