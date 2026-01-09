"use client";

import { Search as SearchIcon, Send } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

export function Search({
  onSearch,
  placeholder = "Search your properties, tenants, data or financials.",
  className,
}: {
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState("");

  const isEmpty = value.trim().length === 0;

  function handleSubmit(value: string) {
    const text = value.trim();
    if (!text) return;

    // TODO: serch function here
    setValue("");

    if (inputRef.current) {
      inputRef.current.innerHTML = "";
    }
  }
  function handleInput() {
    const text = inputRef.current?.innerText ?? "";
    console.log(text);
    setValue(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const isEnter = e.key === "Enter";
    const hasModifier = e.shiftKey || e.metaKey || e.ctrlKey || e.altKey;

    if (isEnter && !hasModifier) {
      e.preventDefault();
      const text = inputRef.current?.innerText ?? "";
      handleSubmit(text);
    }
  }

  return (
    <form
      className="group/search w-full"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(value);
      }}
    >
      <div
        className={cn(
          "bg-card rounded-2xl p-2.5 border grid grid-cols-[1fr] [grid-template-areas:'primary'_'footer']",
          className
        )}
      >
        <Textarea
          className="hidden"
          name="message"
          value={value}
          readOnly
          aria-hidden="true"
        />

        <div className="flex min-h-14 items-center overflow-x-hidden px-1.5 [grid-area:primary]">
          <div className="relative flex items-center gap-2 flex-1 max-h-52 overflow-auto text-sm leading-relaxed overscroll-contain">
            <SearchIcon className="h-3 w-3 text-muted-foreground shrink-0" />
            <div className="relative flex-1">
              <div
                ref={inputRef}
                contentEditable="plaintext-only"
                translate="no"
                spellCheck={false}
                className="relative py-2 z-10 outline-none whitespace-pre-wrap leading-none"
                onInput={handleInput}
                onKeyDown={handleKeyDown}
              />
              {isEmpty && (
                <div className="w-full pointer-events-none absolute top-2 text-muted-foreground leading-none">
                  Search your properties, tenants, data or financials.
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 [grid-area:footer]">
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 rounded-full bg-foreground text-background hover:bg-foreground/90"
                aria-label="Send message"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
