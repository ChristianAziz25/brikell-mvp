"use client";

import { Send } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

export default function Chat() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState(""); // plain-text backing value

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

    // TODO: wire this up to useChat sendMessage
    setValue("");
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
  }

  return (
    <form
      className="group/composer w-full"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(value);
      }}
    >
      <div className="bg-card rounded-2xl p-2.5 shadow-sm border grid grid-cols-[1fr_auto] [grid-template-areas:'primary_trailing'_'footer_footer'] gap-y-1.5">
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
              contentEditable
              translate="no"
              spellCheck={false}
              className="relative pt-2 z-10 min-h-14 outline-none whitespace-pre-wrap"
              onInput={handleInput}
              onKeyDown={handleKeyDown}
            />
            {isEmpty && (
              <div className="pointer-events-none absolute inset-x-0 top-2 text-muted-foreground">
                Ask anything about your properties, tenants, or financials
              </div>
            )}
          </div>
        </div>

        <div className="-m-1 max-w-full overflow-x-auto p-1 [grid-area:footer] flex items-center justify-between gap-2">
          <div className="flex min-w-fit items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
            >
              Attach
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
            >
              Search
            </Button>
          </div>

          <div className="flex items-center gap-2 [grid-area:trailing]">
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 rounded-full bg-foreground text-background hover:bg-foreground/90"
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
