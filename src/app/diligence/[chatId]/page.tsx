"use client";

import { type Chat as ChatHistory } from "@/app/api/chat-creation/route";
import Chat from "@/components/chat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MyUIMessage } from "@/types/ChatMessage";
import { useChat } from "@ai-sdk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { Brain, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getConversationTurns } from "./utils/convertTurns";

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
  const { chatId } = useParams<{ chatId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: chatData, isLoading: isChatLoading } = useQuery<ChatHistory>({
    queryKey: ["chat-history", chatId],
    queryFn: async () => {
      const chat = await fetch(`/api/chat-creation?chatId=${chatId}`);
      if (!chat.ok) {
        throw new Error("Failed to fetch chat");
      }
      return chat.json();
    },
    enabled: !!chatId,
  });

  const { mutate: upsertChatHistory } = useMutation({
    mutationFn: async ({
      chatId,
      messages,
    }: {
      chatId: string;
      messages: MyUIMessage[];
    }) => {
      const chat = await fetch(`/api/chat-upsert`, {
        method: "POST",
        body: JSON.stringify({ chatId, messages }),
      });
      if (!chat.ok) {
        throw new Error("Failed to save chat history");
      }
      return chat.json();
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: ["chat-history", data.chatId],
      });
      const previousData = queryClient.getQueryData<ChatHistory>([
        "chat-history",
        data.chatId,
      ]);
      if (previousData) {
        const optimisticMessages = data.messages.map((msg) => ({
          id: crypto.randomUUID(),
          chatId: data.chatId,
          message: JSON.stringify(msg),
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        queryClient.setQueryData<ChatHistory>(["chat-history", data.chatId], {
          ...previousData,
          chatMessages: optimisticMessages,
        });
      }
      return { previousData };
    },
    onError: (_err, { chatId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ["chat-history", chatId],
          context.previousData
        );
      }
    },
    onSettled: (_data, _err, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: ["chat-history", chatId] });
    },
  });

  // useEffect(() => {
  //   if (!isChatLoading && !chatData) {
  //     router.push("/diligence");
  //   }
  // }, [isChatLoading, chatData, router]);

  const initialMessages: MyUIMessage[] = useMemo(() => {
    const rows = chatData?.chatMessages ?? [];
    if (!rows.length) return [];

    return rows
      .map((row) => {
        try {
          return JSON.parse(row.message) as MyUIMessage;
        } catch {
          return null;
        }
      })
      .filter((m): m is MyUIMessage => m !== null);
  }, [chatData]);

  const conversationTurns = useMemo(
    () => getConversationTurns(initialMessages),
    [initialMessages]
  );

  const [context, setContext] = useState<"capex" | "opex" | "all">("all");
  const [queue, setQueue] = useState<string[]>([]);
  const queueRef = useRef<string[]>([]);
  const messageScrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const { messages, sendMessage, status } = useChat<MyUIMessage>({
    id: chatId as string,
    messages: initialMessages,
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    const el = messageScrollRef.current;
    if (!el) return;

    const THRESHOLD = 80; // px from bottom considered "at bottom"

    const handleScroll = () => {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
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
    if (!isLoading) {
      sendMessage({
        text: value,
        metadata: { createdAt: Date.now() },
      });
      return;
    }

    // Otherwise, enqueue the message
    queueRef.current.push(value);
    setQueue([...queueRef.current]);
  }

  useEffect(() => {
    if (status === "ready" && queueRef.current.length > 0) {
      const next = queueRef.current.shift();
      if (next) {
        sendMessage({
          text: next,
          metadata: { createdAt: Date.now() },
        });
      }
      setQueue([...queueRef.current]);
    }
  }, [status, sendMessage]);

  useEffect(() => {
    if (status === "ready" && chatId) {
      upsertChatHistory({ chatId, messages });
    }
  }, [status, messages, upsertChatHistory, chatId]);

  return (
    <div className="flex w-full h-full flex-row gap-6 lg:flex-row min-h-0 p-4">
      <section className="flex flex-col min-h-0 w-48 h-full gap-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Chat History</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {conversationTurns.map((turn, index) => (
                <li key={index} className="mb-3 text-xs">
                  <div className="font-semibold">You:</div>
                  <div className="mb-1 text-muted-foreground">{turn.user}</div>
                  <div className="font-semibold">Assistant:</div>
                  <div className="text-muted-foreground">{turn.assistant}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
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
                      Hello! I&apos;m your AI analyst. Ask me anything about
                      your data. I can help you analyze trends and answer
                      questions about your information.
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
                  <div className="flex flex-col gap-2">
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
                    <p
                      className={cn(
                        "text-xs text-muted-foreground",
                        message.role === "user" ? "text-right" : "text-left"
                      )}
                    >
                      {message.metadata?.createdAt
                        ? new Date(
                            message.metadata.createdAt
                          ).toLocaleTimeString()
                        : ""}
                    </p>
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

          <div className="pointer-events-none absolute w-full inset-x-0 bottom-0 flex justify-between p-4">
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
            {queue.length > 0 && (
              <Card className="bg-muted/30">
                <CardHeader className="p-3 pb-0">
                  <CardTitle>
                    <p className="text-sm">Queue</p>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  {queue.map((message) => (
                    <p className="text-xs" key={message}>
                      <span>you:</span> {message}
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="shrink-0">
          <Chat eventHandler={handleChatEvent} className="shadow-md" />
        </div>
      </section>
    </div>
  );
}
