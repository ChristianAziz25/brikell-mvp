"use client";

import { type Chat as ChatHistory } from "@/app/api/chat-creation/route";
import Chat from "@/components/chat";
import { PageAnimation } from "@/components/page-animation";
import { cn } from "@/lib/utils";
import type { MyUIMessage } from "@/types/ChatMessage";
import { useChat } from "@ai-sdk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { motion } from "framer-motion";
import { Brain, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import type { MouseEvent } from "react";
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
  const queryClient = useQueryClient();

  const { data: chatData } = useQuery<ChatHistory>({
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

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 });
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const previewAnimationRef = useRef<number | null>(null);

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
    const lerp = (start: number, end: number, factor: number) =>
      start + (end - start) * factor;

    const animate = () => {
      setSmoothPosition((prev) => ({
        x: lerp(prev.x, mousePosition.x, 0.15),
        y: lerp(prev.y, mousePosition.y, 0.15),
      }));
      previewAnimationRef.current = requestAnimationFrame(animate);
    };

    previewAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (previewAnimationRef.current) {
        cancelAnimationFrame(previewAnimationRef.current);
      }
    };
  }, [mousePosition]);

  const handlePreviewMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (previewContainerRef.current) {
      const rect = previewContainerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handlePreviewMouseEnter = (index: number) => {
    setHoveredIndex(index);
    setIsPreviewVisible(true);
  };

  const handlePreviewMouseLeave = () => {
    setHoveredIndex(null);
    setIsPreviewVisible(false);
  };

  useEffect(() => {
    const el = messageScrollRef.current;
    if (!el) return;

    if (isUserScrolling.current) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  }, [isLoading, messages.length]);

  function handleChatEvent(value: string) {
    if (!isLoading) {
      sendMessage({
        text: value,
        metadata: { createdAt: Date.now() },
      });
      return;
    }
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
    <PageAnimation>
      <div className="flex w-full min-h-screen gap-6">
        <section
          ref={previewContainerRef}
          onMouseMove={handlePreviewMouseMove}
          className="relative flex flex-col w-64 top-0 self-start"
          style={{ height: "calc(100vh - 2rem)" }}
        >
          <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar overscroll-y-contain p-2 flex-1 min-h-0">
            {conversationTurns.map((turn, index) => (
              <div
                key={index}
                style={{
                  perspective: 900,
                  width: "100%",
                }}
              >
                <motion.div
                  onMouseEnter={() => handlePreviewMouseEnter(index)}
                  onMouseLeave={handlePreviewMouseLeave}
                  whileHover={{
                    rotateX: -8,
                    rotateY: 8,
                    zIndex: 20,
                    scale: 1.04,
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    transformStyle: "preserve-3d",
                    cursor: "pointer",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                  className="rounded-xl bg-card shadow-lg px-3 py-2"
                >
                  <div className="mb-1 text-xs font-semibold text-muted-foreground truncate">
                    You:{turn.user}
                  </div>
                  <div className="mb-1 text-xs font-semibold text-muted-foreground truncate">
                    Assistant: {turn.assistant}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
          <div
            className="pointer-events-none absolute z-50 overflow-hidden rounded-xl shadow-2xl"
            style={{
              transform: `translate3d(${smoothPosition.x + 16}px, ${
                smoothPosition.y - 60
              }px, 0)`,
              opacity:
                isPreviewVisible &&
                hoveredIndex !== null &&
                !!conversationTurns.length
                  ? 1
                  : 0,
              scale:
                isPreviewVisible &&
                hoveredIndex !== null &&
                !!conversationTurns.length
                  ? 1
                  : 0.8,
              transition:
                "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), scale 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div className="relative w-[360px] max-w-[420px] bg-card rounded-xl border border-border">
              {hoveredIndex !== null && conversationTurns[hoveredIndex] && (
                <div className="flex h-full w-full flex-col p-4 gap-2">
                  <div className="text-xs font-semibold text-muted-foreground">
                    You
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {conversationTurns[hoveredIndex].user}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-muted-foreground">
                    Assistant
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {conversationTurns[hoveredIndex].assistant}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
        <section className="flex flex-1 flex-col min-h-0 relative">
          <div className="relative flex-1 min-h-0 mb-4">
            <div
              ref={messageScrollRef}
              className="h-full space-y-4 overflow-y-auto p-6 pb-32 no-scrollbar"
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

            {/* <div className="pointer-events-none absolute w-full inset-x-0 bottom-0 flex justify-between p-4">
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
          </div> */}
          </div>

          <div className="sticky bottom-0 bg-white dark:bg-neutral-900">
            <Chat eventHandler={handleChatEvent} className="shadow-md" />
          </div>
        </section>
      </div>
    </PageAnimation>
  );
}
