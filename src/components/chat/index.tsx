"use client";

import {
  FileText,
  Loader2,
  PlusIcon,
  Send,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

const TW_BUTTON_CLASSNAME =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-background hover:bg-accent hover:text-accent-foreground h-8 rounded-full px-3 text-xs cursor-pointer";

export function Chat({
  eventHandler,
  className,
}: {
  eventHandler?: (value: string) => void;
  className?: string;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState("");
  
  // PDF state
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const isEmpty = value.trim().length === 0;

  function handleInput() {
    const text = editorRef.current?.innerText ?? "";
    setValue(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const isEnter = e.key === "Enter";
    const hasModifier = e.shiftKey || e.metaKey || e.ctrlKey || e.altKey;

    if (isEnter && !hasModifier) {
      e.preventDefault();
      const text = editorRef.current?.innerText ?? "";
      handleSubmit(text);
    }
  }

  function handleSubmit(value: string) {
    const text = value.trim();
    if (!text) return;

    if (eventHandler) {
      eventHandler(text);
    }
    setValue("");
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setAttachedFile(file);
      setParseError(null);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleRemoveFile() {
    setAttachedFile(null);
    setParseError(null);
  }

  async function handleParseData() {
    if (!attachedFile) return;

    const fileName = attachedFile.name;
    setIsParsing(true);
    setParseError(null);

    try {
      const formData = new FormData();
      formData.append("pdf", attachedFile);

      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to parse PDF");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "content") {
                fullContent += data.content;
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // Clear file first, then send message
      setAttachedFile(null);
      
      // Send the final content as a message
      if (eventHandler && fullContent) {
        eventHandler(`📄 **${fileName}**\n\n${fullContent}`);
      }
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Failed to parse PDF");
    } finally {
      setIsParsing(false);
    }
  }

  return (
    <form
      className={cn("group/composer w-full", className)}
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(value);
      }}
    >
      <div
        className={cn(
          "bg-card rounded-2xl p-2.5 border grid grid-cols-[1fr] [grid-template-areas:'header'_'primary'_'footer'] gap-y-1.5"
        )}
      >
        {/* File attachment bar - shows above input when PDF is attached */}
        {attachedFile && (
          <div className="[grid-area:header]">
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-zinc-50 rounded-xl shadow-sm border border-zinc-100">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-zinc-100">
                  <FileText className="h-4 w-4 text-zinc-500" />
                </div>
                <span className="text-sm text-zinc-700 font-medium truncate">{attachedFile.name}</span>
                {!isParsing && (
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 hover:bg-zinc-200 rounded-lg flex-shrink-0 transition-colors"
                  >
                    <X className="h-3 w-3 text-zinc-400" />
                  </button>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleParseData}
                disabled={isParsing}
                className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 h-9 px-5 text-xs font-medium shadow-sm"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  "Parse Data"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Error message */}
        {parseError && (
          <div className="px-4 py-3 text-sm text-red-600 bg-red-50 rounded-xl shadow-sm border border-red-100 [grid-area:header]">
            {parseError}
          </div>
        )}

        <Textarea
          className="hidden"
          name="message"
          value={value}
          readOnly
          aria-hidden="true"
        />

        <div className="-my-2.5 flex min-h-14 items-center overflow-x-hidden px-1.5 [grid-area:primary]">
          <div className="relative flex-1 max-h-52 overflow-auto text-sm leading-relaxed overscroll-contain">
            <div
              ref={editorRef}
              contentEditable="plaintext-only"
              translate="no"
              spellCheck={false}
              className="relative py-2 z-10 min-h-14 outline-none whitespace-pre-wrap"
              onInput={handleInput}
              onKeyDown={handleKeyDown}
            />
            {isEmpty && !attachedFile && (
              <div className="pointer-events-none absolute inset-x-0 top-2 text-muted-foreground">
                Ask anything about your properties, tenants, or financials
              </div>
            )}
          </div>
        </div>

        <div className="max-w-full overflow-x-auto p-1 [grid-area:footer] flex items-center justify-between gap-2">
          <div className="flex min-w-fit items-center gap-1.5">
            <label htmlFor="pdf-upload" className={TW_BUTTON_CLASSNAME}>
              <PlusIcon className="h-4 w-4" />
            </label>
            <input
              id="pdf-upload"
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-2 [grid-area:footer]">
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 rounded-full text-primary bg-white hover:bg-primary hover:text-background transition-colors duration-200 ease-in-out"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
