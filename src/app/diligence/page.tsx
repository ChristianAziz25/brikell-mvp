"use client";

import Chat from "@/components/chat";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { Brain, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const agents = ["capex", "opex", "all"];

export default function Page() {
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

            {messages.map((message) => (
              <div
                key={message.id}
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
                      {(() => {
                        // Helper function to get emoji based on part type and state
                        const getPartEmoji = (
                          part: { type?: string; state?: string } | undefined
                        ) => {
                          if (!part) return "⏳";

                          const partType = part.type || "";
                          const partState = part.state || "";

                          // Handle step-start
                          if (partType === "step-start") {
                            return "🚀";
                          }

                          // Handle reasoning
                          if (partType === "reasoning") {
                            if (partState === "done") {
                              return "💭";
                            }
                            return "🤔";
                          }

                          // Handle tool calls
                          if (partType.startsWith("tool-")) {
                            if (partState === "output-available") {
                              return "✅";
                            }
                            if (partState === "call") {
                              return "🔧";
                            }
                            // Default tool emoji
                            return "⚙️";
                          }

                          // Handle text parts
                          if (partType === "text") {
                            return null; // No emoji for text
                          }

                          // Default loading emoji
                          return "⏳";
                        };

                        if (message.role !== "assistant") {
                          // For user messages, just render text parts
                          const textParts =
                            message.parts
                              ?.filter((p) => p.type === "text")
                              .map((part, i) => (
                                <p
                                  className="text-primary-foreground"
                                  key={`${message.id}-${i}`}
                                >
                                  {part.text}
                                </p>
                              )) || [];
                          return textParts.length > 0 ? textParts : null;
                        }

                        // For assistant messages
                        const textParts =
                          message.parts
                            ?.filter((p) => p.type === "text")
                            .map((part, i) => (
                              <p
                                className="text-chat-machine-color"
                                key={`${message.id}-text-${i}`}
                              >
                                {part.text}
                              </p>
                            )) || [];

                        // Get tool parts with available output
                        const toolOutputParts =
                          message.parts
                            ?.filter((p) => {
                              // Type guard: check if part has tool-related properties
                              const hasToolType = p.type?.startsWith("tool-");
                              const hasState = "state" in p;
                              const hasOutput = "output" in p;
                              return (
                                hasToolType &&
                                hasState &&
                                (p as { state?: string }).state ===
                                  "output-available" &&
                                hasOutput &&
                                (p as { output?: unknown }).output !== undefined
                              );
                            })
                            .map((part, i) => {
                              // Type guard: safely access output
                              const partWithOutput = part as {
                                output?:
                                  | string
                                  | { response?: string }
                                  | unknown;
                              };
                              // Handle output from tool - it can be a string or an object
                              const outputText =
                                typeof partWithOutput.output === "string"
                                  ? partWithOutput.output
                                  : typeof partWithOutput.output === "object" &&
                                    partWithOutput.output !== null &&
                                    "response" in partWithOutput.output
                                  ? (
                                      partWithOutput.output as {
                                        response: string;
                                      }
                                    ).response
                                  : typeof partWithOutput.output === "object" &&
                                    partWithOutput.output !== null
                                  ? JSON.stringify(partWithOutput.output)
                                  : "";

                              if (!outputText) return null;

                              return (
                                <p
                                  className="text-chat-machine-color"
                                  key={`${message.id}-tool-${i}`}
                                >
                                  {outputText}
                                </p>
                              );
                            })
                            .filter((p) => p !== null) || [];

                        // Get non-text parts for emoji display
                        const nonTextParts =
                          message.parts?.filter((p) => p.type !== "text") || [];

                        // Combine text parts and tool outputs
                        const allContentParts = [
                          ...textParts,
                          ...toolOutputParts,
                        ];

                        // If we have any content to display, show it
                        if (allContentParts.length > 0) {
                          return (
                            <>
                              {allContentParts}
                              {status === "streaming" && (
                                <span className="inline-block ml-2 animate-pulse">
                                  {getPartEmoji(
                                    nonTextParts[nonTextParts.length - 1]
                                  ) || "⏳"}
                                </span>
                              )}
                            </>
                          );
                        }

                        // No text parts yet - show emoji based on current part state
                        if (message.parts && message.parts.length > 0) {
                          const latestPart =
                            message.parts[message.parts.length - 1];
                          const emoji = getPartEmoji(latestPart);
                          return (
                            <span className="inline-block animate-pulse text-xl">
                              {emoji || "⏳"}
                            </span>
                          );
                        }

                        // No parts at all - show default loader
                        return (
                          <Loader2 className="h-4 w-4 text-chat-machine-color animate-spin" />
                        );
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
