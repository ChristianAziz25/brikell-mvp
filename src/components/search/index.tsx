"use client";

import { Building2, Home, Search as SearchIcon, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

type SearchResultItem = {
  id: string | number;
  type: "building" | "unit";
  name?: string;
  address?: string;
  city?: string;
  country?: string;
  propertyName?: string;
  unitType?: string;
  tenantName1?: string;
  tenantName2?: string;
  status?: string;
  assetId?: string;
};

type SearchResult = {
  buildings: SearchResultItem[];
  units: SearchResultItem[];
};

export function Search({
  onSearch,
  placeholder = "Search your properties, units and data across your entire portfolio.",
  className,
}: {
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const isEmpty = value.trim().length === 0;
  const hasResults =
    searchResults &&
    (searchResults.buildings.length > 0 || searchResults.units.length > 0);

  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length === 0) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  function handleSubmit(value: string) {
    const text = value.trim();
    if (!text) return;

    if (onSearch) {
      onSearch(text);
    }
    setValue("");
    if (inputRef.current) {
      inputRef.current.innerHTML = "";
    }
    setShowResults(false);
  }

  function handleInput() {
    const text = inputRef.current?.innerText ?? "";
    setValue(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.trim().length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(text);
      }, 300);
    } else {
      setSearchResults(null);
      setShowResults(false);
    }
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

  const handleResultClick = (item: SearchResultItem) => {
    setValue("");
    setShowResults(false);
    if (inputRef.current) {
      inputRef.current.innerHTML = "";
    }
    if (item.type === "building" && item.name) {
      router.push(`/properties/${item.name}`);
    } else if (item.type === "unit" && item.assetId) {
      router.push(`/properties/${item.assetId}`);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <form
        className="group/search w-full"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(value);
        }}
      >
        <div
          className={cn(
            "bg-card rounded-2xl p-3 shadow-card grid grid-cols-[1fr] [grid-template-areas:'primary'_'footer'] transition-all duration-300 focus-within:shadow-card-hover",
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

          <div className="flex min-h-14 items-center overflow-x-hidden px-2 [grid-area:primary]">
            <div className="relative flex items-center gap-3 flex-1 max-h-52 overflow-auto text-[13px] leading-relaxed overscroll-contain">
              <SearchIcon className="h-4 w-4 text-muted-foreground/60 shrink-0" />
              <div className="relative flex-1">
                <div
                  ref={inputRef}
                  contentEditable="plaintext-only"
                  translate="no"
                  spellCheck={false}
                  className="relative py-2 z-10 outline-none whitespace-pre-wrap leading-relaxed text-foreground/80"
                  onInput={handleInput}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (hasResults) setShowResults(true);
                  }}
                />
                {isEmpty && (
                  <div className="w-full pointer-events-none absolute top-2 text-muted-foreground/50 leading-relaxed">
                    {placeholder}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 [grid-area:footer]">
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-sm transition-all duration-200 hover:scale-105"
                  aria-label="Send message"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && value.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-card border-0 rounded-2xl shadow-lg max-h-96 overflow-y-auto z-50 animate-fade-in">
          {isSearching ? (
            <div className="p-6 text-center text-sm text-muted-foreground/70">
              Searching...
            </div>
          ) : hasResults ? (
            <div className="p-3">
              {searchResults.buildings.length > 0 && (
                <div className="mb-4">
                  <div className="section-label px-3 py-2">
                    Buildings
                  </div>
                  <div className="space-y-0.5">
                    {searchResults.buildings.map((building) => (
                      <button
                        key={building.id}
                        type="button"
                        className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-all duration-200 text-left"
                        onClick={() => handleResultClick(building)}
                      >
                        <Building2 className="h-4 w-4 text-muted-foreground/60 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-foreground/90 truncate">
                            {building.name}
                          </div>
                          {(building.address || building.city) && (
                            <div className="text-xs text-muted-foreground/70 truncate mt-0.5">
                              {[building.address, building.city]
                                .filter(Boolean)
                                .join(", ")}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.units.length > 0 && (
                <div>
                  <div className="section-label px-3 py-2">
                    Units
                  </div>
                  <div className="space-y-0.5">
                    {searchResults.units.map((unit) => (
                      <button
                        key={unit.id}
                        type="button"
                        className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-all duration-200 text-left"
                        onClick={() => handleResultClick(unit)}
                      >
                        <Home className="h-4 w-4 text-muted-foreground/60 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-foreground/90 truncate">
                            {unit.address}
                          </div>
                          <div className="text-xs text-muted-foreground/70 truncate mt-0.5">
                            {unit.propertyName} • {unit.unitType}
                            {unit.tenantName1 && ` • ${unit.tenantName1}`}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground/70">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
