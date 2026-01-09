"use client";

import {
  Database,
  FileText,
  Link,
  PlusIcon,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

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
  const [value, setValue] = useState("");

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
    if (eventHandler) {
      eventHandler(text);
    }
    setValue("");
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
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
          "bg-card rounded-2xl p-2.5 border grid grid-cols-[1fr] [grid-template-areas:'primary'_'footer'] gap-y-1.5"
        )}
      >
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
            {isEmpty && (
              <div className="pointer-events-none absolute inset-x-0 top-2 text-muted-foreground">
                Ask anything about your properties, tenants, or financials
              </div>
            )}
          </div>
        </div>

        <div className="-m-1 max-w-full overflow-x-auto p-1 [grid-area:footer] flex items-center justify-between gap-2">
          <div className="flex min-w-fit items-center gap-1.5">
            <label htmlFor="file-upload" className={TW_BUTTON_CLASSNAME}>
              <PlusIcon className="h-4 w-4" />
            </label>
            <input id="file-upload" type="file" className="hidden" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={TW_BUTTON_CLASSNAME}>
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 p-0" align="start">
                {/* Header */}
                <div className="p-4 border-b border-border">
                  <h4 className="font-medium text-sm">Connect Data Sources</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Link your data platforms
                  </p>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <DropdownMenuItem className="p-0 focus:bg-transparent">
                    <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors text-left">
                      <div className="w-8 h-8 rounded-md bg-orange-500/10 flex items-center justify-center shrink-0">
                        <Database className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Databricks</p>
                        <p className="text-xs text-muted-foreground">
                          Connect lakehouse
                        </p>
                      </div>
                      <Link className="w-4 h-4 ml-auto text-muted-foreground shrink-0" />
                    </button>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="p-0 focus:bg-transparent">
                    <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors text-left">
                      <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Database className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Snowflake</p>
                        <p className="text-xs text-muted-foreground">
                          Connect warehouse
                        </p>
                      </div>
                      <Link className="w-4 h-4 ml-auto text-muted-foreground shrink-0" />
                    </button>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="p-0 focus:bg-transparent">
                    <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors text-left">
                      <div className="w-8 h-8 rounded-md bg-cyan-500/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-cyan-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">SharePoint</p>
                        <p className="text-xs text-muted-foreground">
                          Connect documents
                        </p>
                      </div>
                      <Link className="w-4 h-4 ml-auto text-muted-foreground shrink-0" />
                    </button>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <label htmlFor="text-upload" className={TW_BUTTON_CLASSNAME}>
              <FileText className="h-4 w-4" />
            </label>
            <input id="text-upload" type="file" className="hidden" />
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
