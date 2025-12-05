"use client";

import Chat from "@/components/chat";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { Brain, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const tips = [
  "Upload your dataset or report for analysis",
  "Ask follow-up questions in the chat",
  "AI can generate charts and graphs",
];

const agents = ["capex", "opex", "all"];

export default function Page() {
  const [input, setInput] = useState("");
  const [context, setContext] = useState<"capex" | "opex" | "all">("all");

  const messageScrollRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status } = useChat();

  useEffect(() => {
    if (!messageScrollRef.current) return;

    const scrollToBottom = () => {
      messageScrollRef.current?.scrollTo({
        top: messageScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    };

    scrollToBottom();

    if (status === "streaming") {
      const interval = setInterval(scrollToBottom, 100);
      return () => clearInterval(interval);
    }
  }, [messages, status]);

  function handleChatEvent(value: string) {
    sendMessage({ text: value }, { body: { customKey: context } });
  }

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
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/20">
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
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="flex max-w-3xl items-start gap-3">
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Brain className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "rounded-tr-sm bg-primary text-primary-foreground"
                        : "rounded-tl-sm bg-muted"
                    }`}
                  >
                    <div className="text-sm text-foreground whitespace-pre-wrap">
                      {(() => {
                        if (
                          message.role === "assistant" &&
                          (!message.parts ||
                            message.parts.length === 0 ||
                            !message.parts.some((p) => p.type === "text"))
                        ) {
                          return (
                            <Loader2 className="h-4 w-4 text-chat-machine-color animate-spin" />
                          );
                        }

                        return message.parts.map((part, i) => {
                          switch (part.type) {
                            case "text":
                              switch (message.role) {
                                case "assistant":
                                  return (
                                    <p
                                      className="text-chat-machine-color"
                                      key={`${message.id}-${i}`}
                                    >
                                      {part.text}
                                    </p>
                                  );
                                case "user":
                                  return (
                                    <p
                                      className="text-primary-foreground"
                                      key={`${message.id}-${i}`}
                                    >
                                      {part.text}
                                    </p>
                                  );
                                default:
                                  return null;
                              }
                            default:
                              return null;
                          }
                        });
                      })()}
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
