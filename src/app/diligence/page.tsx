"use client";

import Chat from "@/components/chat";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { Brain, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const agents = ["capex", "opex", "all"];

function extractMessageContent(message: UIMessage): string {
  const msg = message as {
    content?: string | Array<{ type?: string; text?: string }>;
    parts?: Array<{ type?: string; text?: string }>;
  };

  if (typeof msg.content === "string") {
    return msg.content;
  }
  if (Array.isArray(msg.content)) {
    const textPart = msg.content.find((part) => part.type === "text");
    return textPart?.text || "";
  }
  // Handle message.parts if content is not directly available
  if (Array.isArray(msg.parts)) {
    const textPart = msg.parts.find((part) => part.type === "text");
    return textPart?.text || "";
  }
  return "";
}

export default function Page() {
  const [context, setContext] = useState<"capex" | "opex" | "all">("all");
  const queueRef = useRef<string[]>([]);
  const messageScrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);

  // Use useChat for faster text streaming - automatically handles messages and conversation history
  // TextStreamChatTransport is required for streamText responses (toTextStreamResponse)
  const { messages, sendMessage, status, error } = useChat();

  // Debug: Log messages, status, and errors
  useEffect(() => {
    if (messages.length > 0) {
      console.log("Messages count:", messages.length);
      console.log("Last message:", messages[messages.length - 1]);
      console.log("All messages:", messages);
      console.log("Status:", status);
    }
    if (error) {
      toast.error(`Chat error: ${error.message}`);
      console.error("Chat error:", error);
    }
  }, [messages, status, error]);

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    const el = messageScrollRef.current;
    if (!el) return;

    const THRESHOLD = 80; // px from bottom considered "at bottom"

    const handleScroll = () => {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      // user is considered "scrolling" if they've moved up beyond threshold
      isUserScrolling.current = distanceFromBottom > THRESHOLD;
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const el = messageScrollRef.current;
    if (!el) return;

    if (isUserScrolling.current) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  }, [isLoading, messages.length]);

  // When user presses Enter:
  function handleChatEvent(value: string) {
    // If assistant is idle, send immediately
    if (!isLoading) {
      sendMessage({
        role: "user",
        content: value,
      } as unknown as Parameters<typeof sendMessage>[0]);
      return;
    }

    // Otherwise, enqueue the message
    queueRef.current.push(value);
  }

  // When current request finishes, send next queued message (if any)
  useEffect(() => {
    if (status === "ready" && queueRef.current.length > 0) {
      const next = queueRef.current.shift();
      if (next) {
        sendMessage({
          role: "user",
          content: next,
        } as unknown as Parameters<typeof sendMessage>[0]);
      }
    }
  }, [status, sendMessage]);

  return (
    <div className="flex w-full h-full flex-col gap-6 lg:flex-row min-h-0 p-4">
      <section className="flex flex-1 flex-col min-h-0 gap-4">
        <div className="relative flex-1 min-h-0 rounded-2xl border bg-card shadow-md">
          <div
            ref={messageScrollRef}
            className="h-full space-y-4 overflow-y-auto p-6 pb-16 no-scrollbar"
          >
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="flex max-w-3xl items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/30">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-muted/20 px-4 py-3">
                    <p className="text-sm text-foreground">
                      Hello! I&apos;m your AI analyst. Upload a file and ask me
                      anything about your data. I can help you analyze trends,
                      create visualizations, and answer questions about your
                      information.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={`${message.id}-${index}`}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="flex max-w-3xl items-start gap-3">
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/30">
                      <Brain className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "rounded-tr-sm bg-primary text-primary-foreground"
                        : "rounded-tl-sm bg-muted/30"
                    }`}
                  >
                    <div className="text-sm text-foreground whitespace-pre-wrap">
                      {message.role === "user" ? (
                        <p className="text-primary-foreground">
                          {extractMessageContent(message)}
                        </p>
                      ) : (
                        // Show message content (streaming or completed)
                        <p className="text-chat-machine-color">
                          {extractMessageContent(message) || (
                            <Loader2 className="h-4 w-4 text-chat-machine-color animate-spin inline-block" />
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                      <span className="text-xs font-medium text-primary-foreground">
                        U
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Show loading indicator for the current streaming message */}
            {isLoading &&
              messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="flex max-w-3xl items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/30">
                      <Brain className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-muted/30 px-4 py-3">
                      <Loader2 className="h-4 w-4 text-chat-machine-color animate-spin" />
                    </div>
                    <div className="text-sm text-muted animate-pulse self-center">
                      thinking...
                    </div>
                  </div>
                </div>
              )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-start p-4">
            <div className="hidden md:flex items-center gap-2 pointer-events-auto">
              {agents.map((agent) => (
                <button
                  className={cn("cursor-pointer")}
                  key={agent}
                  onClick={() => setContext(agent as "capex" | "opex" | "all")}
                >
                  <Badge
                    variant={context === agent ? "default" : "secondary"}
                    className="hover:bg-muted/30"
                  >
                    {agent}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <Chat eventHandler={handleChatEvent} className="shadow-md" />
        </div>
      </section>
    </div>
  );
}
