"use client";

import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

interface ConversationTurn {
  user: string;
  assistant: string;
}

interface ConversationHistoryProps {
  conversationTurns: ConversationTurn[];
}

export function ConversationHistory({
  conversationTurns,
}: ConversationHistoryProps) {
  return (
    <aside className="flex flex-col w-64 shrink-0 rounded-md border-l border-border bg-muted/10 h-full">
      {/* Header */}
      <div className="shrink-0 px-4 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">
          Conversation History
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {conversationTurns.length}{" "}
          {conversationTurns.length === 1 ? "turn" : "turns"}
        </p>
      </div>

      {/* Conversation List */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        {conversationTurns.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-full px-4 py-8 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No conversation yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Start chatting to see history
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-2">
            {conversationTurns.map((turn, index) => (
              <div
                key={index}
                className={cn(
                  "group relative rounded-lg px-3 py-3",
                  "hover:bg-muted/20 transition-colors duration-150",
                  "cursor-pointer border border-transparent hover:border-border"
                )}
              >
                {/* User Message */}
                <div className="mb-2">
                  <div className="flex justify-between items-center">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      You
                    </div>
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary">
                      <span className="text-xs font-medium">{index + 1}</span>
                    </div>
                  </div>
                  <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
                    {turn.user}
                  </p>
                </div>

                {/* Assistant Response */}
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Assistant
                  </div>
                  <p className="text-xs text-foreground/80 line-clamp-3 leading-relaxed">
                    {turn.assistant}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
