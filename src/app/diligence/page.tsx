"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { Loader2, Send, Sparkles, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const tips = [
  "Upload your dataset or report for analysis",
  "Ask follow-up questions in the chat",
  "AI can generate charts and graphs",
];

export default function Page() {
  const [input, setInput] = useState("");
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

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row min-h-[600px] md:h-full">
      <aside className="w-full space-y-6 lg:w-72">
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-foreground">Upload File</h3>
          <label
            htmlFor="diligence-file-upload"
            className="block cursor-pointer space-y-3 rounded-2xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-muted-foreground"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drag & drop your file here
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, CSV, XLSX supported
              </p>
            </div>
          </label>
          <input id="diligence-file-upload" type="file" className="hidden" />
        </section>

        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-foreground">Tips</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {tips.map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      <section className="flex flex-1 flex-col min-h-[600px]">
        <div className="flex flex-1 flex-col rounded-2xl border bg-card shadow-sm min-h-0">
          <header className="border-b p-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">AI Assistant</h2>
                <p className="text-sm text-muted-foreground">
                  Ready to analyze your data
                </p>
              </div>
            </div>
          </header>

          <div
            ref={messageScrollRef}
            className="flex-1 space-y-4 overflow-y-auto p-6 min-h-0 no-scrollbar"
          >
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="flex max-w-3xl items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
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
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
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

          <footer className="border-t p-4 shrink-0">
            <form
              className="relative"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage({ text: input });
                setInput("");
              }}
            >
              <Input
                className="h-12 rounded-2xl pr-12"
                placeholder="Ask something about your file..."
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-2 top-1/2 flex h-8 -translate-y-1/2 gap-1 rounded-xl px-3"
              >
                Send
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </footer>
        </div>
      </section>
    </div>
  );
}
