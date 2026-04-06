"use client";

import { useSearchParams } from "next/navigation";
import { usePaginatedQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { SearchResults } from "@/components/SearchResults";
import { useLayoutContext } from "@/components/Layout";
import type { Story } from "@/types";
import { Suspense } from "react";

function SearchContent() {
  const { viewMode } = useLayoutContext();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const { results: stories, status } = usePaginatedQuery(
    api.stories.listApproved,
    { searchTerm: query },
    { initialNumItems: 100 },
  );

  if (status === "LoadingFirstPage") {
    return <div>Searching...</div>;
  }

  return (
    <SearchResults
      query={query}
      stories={stories as Story[]}
      viewMode={viewMode}
    />
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
