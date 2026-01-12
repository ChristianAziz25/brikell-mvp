"use client";

import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

interface ChatPreview {
  id: string;
  createdAt: string;
  title: string;
  preview: string;
  messageCount: number;
}

export function ConversationHistory() {
  const router = useRouter();
  const { chatId } = useParams<{ chatId: string }>();

  const { data: chats = [], isLoading } = useQuery<ChatPreview[]>({
    queryKey: ["all-chats"],
    queryFn: async () => {
      const res = await fetch("/api/chats");
      if (!res.ok) throw new Error("Failed to fetch chats");
      return res.json();
    },
  });

  const handleNewChat = () => {
    router.push("/diligence");
  };

  const handleSelectChat = (id: string) => {
    router.push(`/diligence/${id}`);
  };

  return (
    <aside className="flex flex-col w-96 shrink-0 bg-white rounded-2xl border border-zinc-100 shadow-sm h-full">
      {/* Header with New Chat button */}
      <div className="shrink-0 px-5 py-4 flex items-center justify-between border-b border-zinc-100">
        <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Chats
        </h2>
        <button
          onClick={handleNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 py-3">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl p-4 bg-zinc-50 animate-pulse h-24" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-full px-4 py-12 text-center">
            <MessageSquare className="h-6 w-6 text-zinc-300 mb-3" />
            <p className="text-sm text-zinc-400">No conversations yet</p>
            <p className="text-xs text-zinc-300 mt-1">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {chats.map((chat) => {
              const isActive = chat.id === chatId;
              return (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={cn(
                    "group relative rounded-xl p-4 text-left w-full",
                    "border transition-all duration-200",
                    isActive
                      ? "bg-zinc-100 border-zinc-200"
                      : "bg-zinc-50/50 border-zinc-100 hover:bg-zinc-100/70 hover:border-zinc-200"
                  )}
                >
                  {/* Title */}
                  <p className="text-sm font-medium line-clamp-2 leading-relaxed mb-2 text-zinc-800">
                    {chat.title}
                  </p>

                  {/* Preview */}
                  {chat.preview && (
                    <p className="text-xs line-clamp-2 leading-relaxed text-zinc-500">
                      {chat.preview}
                    </p>
                  )}

                  {/* Time */}
                  <p className="text-[10px] mt-2 text-zinc-400">
                    {new Date(chat.createdAt).toLocaleDateString()}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
