"use client";

import React, { useState } from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { StoryShelf } from "@/components/StoryShelf";
import { StoryList } from "@/components/StoryList";
import { IcpBanner } from "@/components/IcpBanner";
import { useLayoutContext } from "@/components/Layout";
import type { Story } from "@/types";
import { Zap, Search, X, ChevronLeft, Tag } from "lucide-react";
import Link from "next/link";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { Input } from "@/components/ui/input";

export default function ExplorePage() {
  const { viewMode, sortPeriod } = useLayoutContext();
  const settings = useQuery(api.settings.get);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<Id<"tags"> | null>(null);

  // Header tags for shelves
  const headerTags = useQuery(api.tags.listHeader);
  // Fresh launches for New Arrivals shelf
  const freshLaunches = useQuery(api.trending.getFreshLaunches, { limit: 6 });

  // Main paginated list — respects tag filter & search
  const {
    results: stories,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.stories.listApproved,
    {
      tagId: selectedTagId ?? undefined,
      sortPeriod: sortPeriod,
    },
    { initialNumItems: settings?.itemsPerPage || 20 },
  );

  const isLoading = status === "LoadingFirstPage" || settings === undefined;

  // Filter stories by local search query (client-side for now)
  const filteredStories = searchQuery.trim()
    ? stories.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.description?.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : stories;

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/"
            className="p-2 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">Explore Shipgrid</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Discover indie apps by category, rating, and trend
            </p>
          </div>
        </div>

        <IcpBanner />

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input
            type="text"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tag pills */}
        {!searchQuery && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setSelectedTagId(null)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedTagId === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border hover:border-foreground/30"
              }`}
            >
              All Apps
            </button>
            {headerTags?.map((tag) => (
              <button
                key={tag._id}
                onClick={() =>
                  setSelectedTagId(
                    selectedTagId === tag._id ? null : tag._id,
                  )
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedTagId === tag._id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted border-border hover:border-foreground/30"
                }`}
                style={
                  selectedTagId !== tag._id && tag.backgroundColor
                    ? {
                        backgroundColor: tag.backgroundColor + "20",
                        color: tag.textColor ?? undefined,
                        borderColor: tag.backgroundColor + "40",
                      }
                    : undefined
                }
              >
                {tag.emoji && <span>{tag.emoji}</span>}
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {/* Tag-based shelves — only when no filter/search active */}
        {!selectedTagId && !searchQuery && !isLoading && (
          <>
            {/* New Arrivals shelf */}
            <StoryShelf
              title="New Arrivals"
              subtitle="Freshest approved products"
              stories={freshLaunches ?? []}
              isLoading={freshLaunches === undefined}
              icon={<Zap className="w-4 h-4" />}
            />

            {/* One shelf per header tag */}
            {headerTags
              ?.filter((tag) => tag.showInHeader)
              .slice(0, 6)
              .map((tag) => (
                <TagShelf key={tag._id} tag={tag} />
              ))}
          </>
        )}

        {/* Browsing by tag — show header */}
        {selectedTagId && !searchQuery && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {headerTags?.find((t) => t._id === selectedTagId)?.name ?? "Category"}
              </span>
            </div>
            <button
              onClick={() => setSelectedTagId(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear filter ×
            </button>
          </div>
        )}

        {/* Search results header */}
        {searchQuery && (
          <div className="mb-4 text-sm text-muted-foreground">
            {filteredStories.length} result{filteredStories.length !== 1 ? "s" : ""} for{" "}
            <span className="font-medium text-foreground">"{searchQuery}"</span>
          </div>
        )}

        {/* Full paginated list — shown when tag/search filter active OR below shelves always */}
        {(selectedTagId || searchQuery) && (
          <div className="mt-2">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredStories.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-muted-foreground mb-4">No apps found.</p>
                <Link href="/submit" className="text-sm text-primary hover:underline">
                  Submit yours →
                </Link>
              </div>
            ) : (
              <StoryList
                stories={filteredStories as Story[]}
                viewMode={viewMode}
                status={status}
                loadMore={loadMore}
                itemsPerPage={settings?.itemsPerPage ?? 20}
              />
            )}
          </div>
        )}

        {/* Divider + full feed below shelves */}
        {!selectedTagId && !searchQuery && (
          <>
            <div className="flex items-center gap-3 my-8">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">All Apps</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <StoryList
              stories={stories as Story[]}
              viewMode={viewMode}
              status={status}
              loadMore={loadMore}
              itemsPerPage={settings?.itemsPerPage ?? 20}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* Per-tag shelf: loads top 6 stories for this tag */
function TagShelf({ tag }: { tag: Doc<"tags"> }) {
  const result = usePaginatedQuery(
    api.stories.listApproved,
    { tagId: tag._id, sortPeriod: "votes_week" },
    { initialNumItems: 6 },
  );

  const stories = result.results ?? [];

  if (result.status === "LoadingFirstPage") return null;
  if (stories.length === 0) return null;

  const mappedStories = stories.map((s: any) => ({
    _id: s._id,
    _creationTime: s._creationTime,
    title: s.title,
    slug: s.slug,
    description: s.description,
    votes: s.votes,
    commentCount: s.commentCount,
    screenshotUrl: s.screenshotUrl,
    averageRating: s.averageRating,
    stage: s.stage,
  }));

  return (
    <StoryShelf
      key={tag._id}
      title={`${tag.emoji ? tag.emoji + " " : ""}${tag.name}`}
      subtitle={`Top ${tag.name} apps this week`}
      stories={mappedStories}
      seeAllHref={`/tag/${tag.slug}`}
      icon={<Tag className="w-4 h-4" />}
    />
  );
}
