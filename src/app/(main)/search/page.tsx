"use client";

import { useSearchParams } from "next/navigation";
import { useAction, usePaginatedQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { SearchResults } from "@/components/SearchResults";
import { useLayoutContext } from "@/components/Layout";
import type { Story } from "@/types";
import { Suspense, useEffect, useState } from "react";
import { Sparkles, Type } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchMode = "keyword" | "ai";

function SearchContent() {
  const { viewMode } = useLayoutContext();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [mode, setMode] = useState<SearchMode>("keyword");
  const [aiStories, setAiStories] = useState<Story[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Keyword search (existing)
  const { results: keywordStories, status } = usePaginatedQuery(
    api.stories.listApproved,
    { searchTerm: query },
    { initialNumItems: 100 },
  );

  // AI semantic search action
  const semanticSearch = useAction(api.embeddings.semanticSearchStories);

  // Run AI search only when mode is AI and query changes
  useEffect(() => {
    if (mode !== "ai" || !query.trim()) {
      setAiStories(null);
      return;
    }
    let cancelled = false;
    setAiLoading(true);
    setAiError(null);
    semanticSearch({ searchTerm: query, limit: 30 })
      .then((res) => {
        if (!cancelled) setAiStories((res as Story[]) ?? []);
      })
      .catch((err) => {
        if (!cancelled) setAiError(err?.message ?? "AI search failed");
      })
      .finally(() => {
        if (!cancelled) setAiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, query, semanticSearch]);

  const isLoading =
    mode === "keyword" ? status === "LoadingFirstPage" : aiLoading;
  const stories =
    mode === "keyword" ? (keywordStories as Story[]) : aiStories ?? [];

  return (
    <div>
      {/* Mode Toggle */}
      <div className="mb-4 flex items-center gap-2">
        <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setMode("keyword")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "keyword"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Type className="h-3.5 w-3.5" />
            Keyword
          </button>
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "ai"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Smart (AI)
          </button>
        </div>
        {mode === "ai" && (
          <span className="text-xs text-muted-foreground">
            Powered by semantic embeddings — finds apps by intent, not just keywords.
          </span>
        )}
      </div>

      {aiError && mode === "ai" && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {aiError}
        </div>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">
          {mode === "ai" ? "Thinking…" : "Searching…"}
        </div>
      ) : (
        <SearchResults
          query={query}
          stories={stories}
          viewMode={viewMode}
          mode={mode}
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
