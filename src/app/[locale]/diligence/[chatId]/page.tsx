"use client";

import { type Chat as ChatHistory } from "@/app/api/chat-creation/route";
import { Chat } from "@/components";
import { AnswerLoadingState } from "@/components/answer";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { PageAnimation } from "@/components/page-animation";
import { PdfResearchPanel, FastPdfResearchPanel } from "@/components/pdf-research";
import { cn } from "@/lib/utils";
import type { MyUIMessage } from "@/types/ChatMessage";
import { useChat } from "@ai-sdk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { Brain, FileText, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConversationHistory } from "./ConversationHistory";

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
  if (Array.isArray(msg.parts)) {
    const textPart = msg.parts.find((part) => part.type === "text");
    return textPart?.text || "";
  }
  return "";
}

export default function Page() {
  const { chatId } = useParams<{ chatId: string }>();
  const queryClient = useQueryClient();

  // PDF state for deep research
  // NEW: Fast parsing uses File directly (no upload to storage)
  const [activePdfFile, setActivePdfFile] = useState<File | null>(null);
  // LEGACY: Job-based parsing uses jobId (uploads to storage)
  const [activePdfJobId, setActivePdfJobId] = useState<string | null>(null);

  // NEW: Fast parsing handler - no file upload, client-side extraction
  const handlePdfFileReady = useCallback((file: File) => {
    setActivePdfFile(file);
    setActivePdfJobId(null); // Clear any legacy job
  }, []);

  // LEGACY: Job-based handler (for fallback)
  const handlePdfJobStarted = useCallback((jobId: string) => {
    setActivePdfJobId(jobId);
    setActivePdfFile(null); // Clear any fast parse
  }, []);

  const handlePdfDismiss = useCallback(() => {
    setActivePdfFile(null);
    setActivePdfJobId(null);
  }, []);

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

  function handleChatEvent(value: string) {
    if (!isLoading) {
      sendMessage({
        text: value,
        metadata: { createdAt: Date.now() },
      });
      return;
    }
    queueRef.current.push(value);
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
    }
  }, [status, sendMessage]);

  useEffect(() => {
    if (status === "ready" && chatId) {
      upsertChatHistory({ chatId, messages });
    }
  }, [status, messages, upsertChatHistory, chatId]);

  return (
    <PageAnimation>
      <div className="flex w-full h-full gap-6 overflow-hidden overflow-y-hidden">
        <ConversationHistory />
        
        {/* Main Chat Section */}
        <section className="flex flex-1 flex-col min-h-0 min-w-0 bg-white relative overflow-hidden border border-border rounded-2xl">
          <div className="flex-1 min-h-0 overflow-hidden border-b border-border rounded-t-2xl">
            <div
              ref={messageScrollRef}
              className="h-full space-y-4 overflow-y-auto overflow-x-hidden p-6 pb-4 no-scrollbar"
            >
              <div className="w-full max-w-full overflow-x-hidden">
                {/* Hide intro message when PDF parsing is active */}
                {messages.length === 0 && !activePdfFile && !activePdfJobId && (
                  <div className="flex justify-start w-full max-w-full overflow-hidden">
                    <div
                      className="flex max-w-3xl items-start gap-3 min-w-0 overflow-hidden"
                      style={{ maxWidth: "100%" }}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                        <Brain className="h-4 w-4 text-zinc-500" />
                      </div>
                      <div className="bg-zinc-50 rounded-xl shadow-sm border border-zinc-100 overflow-hidden flex-1 min-w-0">
                        <div className="px-5 py-4">
                          <p className="text-sm text-zinc-600">
                            Hello! I&apos;m your AI Agent. Ask me anything about
                            your data. I can help you analyze trends and answer
                            questions about your portfolio.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((message, index) => {
                  const content = extractMessageContent(message);
                  
                  return (
                    <div
                      key={`${message.id}-${index}`}
                      className={`flex w-full max-w-full overflow-hidden ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className="flex max-w-3xl items-start gap-3 min-w-0 overflow-hidden"
                        style={{ maxWidth: "100%" }}
                      >
                        {message.role === "assistant" && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                            <Brain className="h-4 w-4 text-zinc-500" />
                          </div>
                        )}
                        <div className="flex flex-col gap-2 min-w-0 flex-1 max-w-full overflow-hidden">
                          {/* Unified clean card style for all messages */}
                          <div className="bg-zinc-50 rounded-xl shadow-sm border border-zinc-100 overflow-hidden max-w-full">
                            <div className="px-5 py-4">
                              {message.role === "user" ? (
                                <div className="text-sm text-zinc-700 whitespace-pre-wrap break-words">
                                  <MarkdownRenderer
                                    content={content}
                                    className="text-zinc-700 [&_strong]:text-zinc-900 [&_strong]:font-bold [&_p]:text-zinc-600 [&_li]:text-zinc-600"
                                  />
                                </div>
                              ) : (
                                <div className="text-sm overflow-hidden max-w-full">
                                  {content ? (
                                    <MarkdownRenderer
                                      content={content}
                                      className="text-zinc-700 [&_strong]:text-zinc-900 [&_strong]:font-bold [&_p]:text-zinc-600 [&_li]:text-zinc-600"
                                    />
                                  ) : (
                                    <Loader2 className="h-4 w-4 text-zinc-400 animate-spin inline-block" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <p
                            className={cn(
                              "text-xs text-zinc-400",
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
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200">
                            <span className="text-xs font-medium text-zinc-600">
                              U
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading state - shown when waiting for AI response */}
                {isLoading &&
                  messages[messages.length - 1]?.role !== "assistant" && (
                    <div className="flex justify-start w-full max-w-full overflow-hidden">
                      <div
                        className="flex max-w-3xl items-start gap-3 min-w-0 overflow-hidden"
                        style={{ maxWidth: "100%" }}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                          <Brain className="h-4 w-4 text-zinc-500" />
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden flex-1 min-w-0">
                          <div className="px-5 py-4">
                            <AnswerLoadingState />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* PDF Deep Research Panel - NEW Fast Parsing (no storage upload) */}
                {activePdfFile && (
                  <div className="flex justify-start w-full max-w-full overflow-hidden">
                    <div
                      className="flex max-w-3xl items-start gap-3 min-w-0 w-full overflow-hidden"
                      style={{ maxWidth: "100%" }}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                        <FileText className="h-4 w-4 text-zinc-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <FastPdfResearchPanel
                          file={activePdfFile}
                          onDismiss={handlePdfDismiss}
                          onRetry={(file) => setActivePdfFile(file)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* PDF Deep Research Panel - LEGACY Job-based (uploads to storage) */}
                {activePdfJobId && !activePdfFile && (
                  <div className="flex justify-start w-full max-w-full overflow-hidden">
                    <div
                      className="flex max-w-3xl items-start gap-3 min-w-0 w-full overflow-hidden"
                      style={{ maxWidth: "100%" }}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                        <FileText className="h-4 w-4 text-zinc-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <PdfResearchPanel
                          jobId={activePdfJobId}
                          onDismiss={handlePdfDismiss}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Chat
            className="p-4 rounded-b-2xl"
            eventHandler={handleChatEvent}
            // NEW: Fast parsing - client-side extraction, no storage upload
            onPdfFileReady={handlePdfFileReady}
            useFastParsing={true}
            // LEGACY: Job-based system (fallback, uses storage)
            onPdfJobStarted={handlePdfJobStarted}
            usePdfJobSystem={false}
          />
        </section>
      </div>
    </PageAnimation>
  );
}
