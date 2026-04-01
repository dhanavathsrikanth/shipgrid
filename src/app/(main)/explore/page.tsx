"use client";

import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { MatchedStoriesShelf } from "@/components/MatchedStoriesShelf";
import { IcpBanner } from "@/components/IcpBanner";
import { StoryList } from "@/components/StoryList";
import { useLayoutContext } from "@/components/Layout";
import type { Story } from "@/types";
import { Zap, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ExplorePage() {
  const { viewMode, selectedTagId, sortPeriod } = useLayoutContext();
  const settings = useQuery(api.settings.get);

  const {
    results: stories,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.stories.listApproved,
    { tagId: selectedTagId, sortPeriod: sortPeriod },
    { initialNumItems: settings?.itemsPerPage || 20 },
  );

  if (status === "LoadingFirstPage" || settings === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-tight animate-pulse text-muted-foreground">Syncing Discovery Feed...</p>
      </div>
    );
  }

  return (
    <div className="container px-4 mx-auto py-12 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 border border-border" asChild>
            <Link href="/"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-primary" />
              <h1 className="text-3xl font-extrabold tracking-tight title-font">Explore Shipgrid</h1>
            </div>
            <p className="text-sm text-muted-foreground font-medium">The complete feed of verified builder submissions.</p>
          </div>
        </div>
      </div>

      <IcpBanner />
      
      {!selectedTagId && (
        <div className="mb-12">
          <MatchedStoriesShelf />
        </div>
      )}

      <div className="mt-8">
        <StoryList
          stories={stories as Story[]}
          viewMode={viewMode}
          status={status}
          loadMore={loadMore}
          itemsPerPage={settings.itemsPerPage}
        />
      </div>
    </div>
  );
}
