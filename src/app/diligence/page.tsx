"use client";

import Chat from "@/components/chat";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { Brain, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ragResponseSchema } from "../api/use-object/schema";

const agents = ["capex", "opex", "all"];

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  keyInsights?: string[];
};

export default function Page() {
  const [context, setContext] = useState<"capex" | "opex" | "all">("all");
  const [messages, setMessages] = useState<Message[]>([]);

  const messageScrollRef = useRef<HTMLDivElement>(null);
  const { object, submit, isLoading } = useObject({
    api: "/api/use-object",
    schema: ragResponseSchema,
  });

  // Track the last completed response to add to messages when streaming completes
  const lastCompletedResponseRef = useRef<string | null>(null);

  // When streaming completes, add the final response to messages
  useEffect(() => {
    if (
      !isLoading &&
      object?.response &&
      lastCompletedResponseRef.current !== object.response
    ) {
      lastCompletedResponseRef.current = object.response;
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          const keyInsights = object.keyInsights?.filter(
            (insight): insight is string => typeof insight === "string"
          );
          const newMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: object.response || "",
            keyInsights:
              keyInsights && keyInsights.length > 0 ? keyInsights : undefined,
          };

          if (
            lastMessage?.role === "assistant" &&
            lastMessage.id === "pending"
          ) {
            return [...prev.slice(0, -1), newMessage];
          }
          return [...prev, newMessage];
        });
      }, 0);
    }
  }, [isLoading, object]);

  useEffect(() => {
    if (!messageScrollRef.current) return;

    const scrollToBottom = () => {
      messageScrollRef.current?.scrollTo({
        top: messageScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    };

    scrollToBottom();

    if (isLoading) {
      const interval = setInterval(scrollToBottom, 100);
      return () => clearInterval(interval);
    }
  }, [messages, isLoading, object]);

  function handleChatEvent(value: string) {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: value,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add pending assistant message placeholder
    setMessages((prev) => [
      ...prev,
      {
        id: "pending",
        role: "assistant",
        content: "",
      },
    ]);

    // Submit the query
    submit(value);
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
                      {message.role === "user" ? (
                        <p className="text-primary-foreground">
                          {message.content}
                        </p>
                      ) : message.id === "pending" && isLoading ? (
                        // Show streaming content for pending messages
                        <>
                          {object?.response && (
                            <p className="text-chat-machine-color">
                              {object.response}
                            </p>
                          )}
                          {!object?.response && (
                            <Loader2 className="h-4 w-4 text-chat-machine-color animate-spin" />
                          )}
                        </>
                      ) : message.content ? (
                        // Show completed message
                        <>
                          <p className="text-chat-machine-color">
                            {message.content}
                          </p>
                          {message.keyInsights &&
                            message.keyInsights.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-muted">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">
                                  Key Insights:
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                                  {message.keyInsights.map((insight, idx) => (
                                    <li key={idx}>{insight}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                        </>
                      ) : (
                        <Loader2 className="h-4 w-4 text-chat-machine-color animate-spin" />
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
