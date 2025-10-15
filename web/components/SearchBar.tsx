import type { ReactElement } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/router";
import clsx from "clsx";

import { clearSearchCache, searchItems } from "@/lib/search";

type SearchResult = {
  id: string;
  name: string;
  category: string | null;
  last_index_value: number | null;
  slug?: string;
};

const DEBOUNCE_MS = 300;
const MAX_RESULTS = 8;

export default function SearchBar(): ReactElement {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const listboxId = useId();

  const reset = useCallback(() => {
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  const performSearch = useCallback(
    async (value: string) => {
      if (!value.trim()) {
        reset();
        return;
      }

      setIsLoading(true);
      try {
        const payload = await searchItems(value.trim());
        setResults(payload.slice(0, MAX_RESULTS));
        setIsOpen(true);
        setActiveIndex(payload.length > 0 ? 0 : -1);
      } catch (error) {
        clearSearchCache();
        setResults([]);
        setIsOpen(true);
        setActiveIndex(-1);
        console.error("Search failed", error);
      } finally {
        setIsLoading(false);
      }
    },
    [reset]
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const scheduleSearch = useCallback(
    (value: string) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        void performSearch(value);
      }, DEBOUNCE_MS);
    },
    [performSearch]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setQuery(value);
      scheduleSearch(value);
    },
    [scheduleSearch]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (event.key === "Enter") {
        if (activeIndex >= 0 && results[activeIndex]) {
          event.preventDefault();
          const selected = results[activeIndex];
          const slug = selected.slug ?? selected.id;
          void router.push(`/items/${encodeURIComponent(slug)}`);
          reset();
        }
      } else if (event.key === "Escape") {
        reset();
      }
    },
    [activeIndex, isOpen, reset, results, router]
  );

  const handleResultClick = useCallback(
    (index: number) => {
      const selected = results[index];
      if (!selected) {
        return;
      }
      const slug = selected.slug ?? selected.id;
      void router.push(`/items/${encodeURIComponent(slug)}`);
      reset();
    },
    [reset, results, router]
  );

  useEffect(() => {
    if (!isOpen || !listRef.current || activeIndex < 0) {
      return;
    }
    const activeElement = listRef.current.children.item(activeIndex) as HTMLLIElement | null;
    if (activeElement && typeof activeElement.scrollIntoView === "function") {
      activeElement.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, isOpen]);

  const hasResults = results.length > 0;
  const activeId = hasResults && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div className="relative w-full max-w-xl" aria-expanded={isOpen} aria-haspopup="listbox">
      <div className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 shadow-sm transition hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500">
        <svg className="h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.25 5.25a7.5 7.5 0 0011.4 11.4z" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search items, e.g. CPI all items, WPI"
          className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-activedescendant={activeId}
        />
        {isLoading ? (
          <svg className="h-5 w-5 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 104 7.464V16a4 4 0 11-8 0v-4a4 4 0 018 0v3.5a2.5 2.5 0 01-5 0V12" />
          </svg>
        ) : null}
      </div>

      <div
        className={clsx(
          "absolute left-0 right-0 mt-2 origin-top rounded-xl border border-slate-200 bg-white shadow-lg transition-opacity duration-150",
          isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        )}
      >
        <ul
          id={listboxId}
          ref={listRef}
          role="listbox"
          className="max-h-72 overflow-y-auto p-2"
          aria-label="Search suggestions"
        >
          {hasResults ? (
            results.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <li
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  key={`${item.id}-${index}`}
                  aria-selected={isActive}
                  className={clsx(
                    "cursor-pointer rounded-lg px-3 py-2 transition-colors",
                    isActive ? "bg-blue-50 text-blue-700" : "hover:bg-slate-100"
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleResultClick(index);
                  }}
                >
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-slate-500">
                    {item.category ?? "general"}
                    {item.last_index_value != null ? ` • Index ${item.last_index_value.toFixed(1)}` : null}
                  </div>
                </li>
              );
            })
          ) : (
            <li
              role="option"
              aria-disabled="true"
              aria-selected="false"
              className="px-3 py-6 text-center text-sm text-slate-500"
            >
              {isLoading ? "Searching..." : query.trim() ? "No results" : "Type to search"}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
