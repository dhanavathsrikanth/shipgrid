"use client";

import React, { useEffect, useState } from "react";
import { usePaginatedQuery, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MatchedStoriesShelf } from "@/components/MatchedStoriesShelf";
import { IcpBanner } from "@/components/IcpBanner";
import { StoryList } from "@/components/StoryList";
import { StoryShelf } from "@/components/StoryShelf";
import { useLayoutContext } from "@/components/Layout";
import type { Story } from "@/types";
import { Zap, Clock, FlaskConical, Info } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { viewMode, selectedTagId, selectedStage, sortPeriod, showMatchedOnly } = useLayoutContext();
  const settings = useQuery(api.settings.get);
  const getMatchedStories = useAction(api.icpMatch.getMatchedStoriesAction);

  const [matchedStories, setMatchedStories] = useState<any[] | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  // Shelf data
  const trendingStories = useQuery(api.trending.getTopTrending, { limit: 8 });
  const freshLaunches = useQuery(api.trending.getFreshLaunches, { limit: 8 });
  const inBeta = useQuery(api.trending.getInBeta, { limit: 8 });

  const {
    results: stories,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.stories.listApproved,
    { tagId: selectedTagId, stage: selectedStage, sortPeriod: sortPeriod },
    { initialNumItems: settings?.itemsPerPage || 20 },
  );

  useEffect(() => {
    if (showMatchedOnly && !matchedStories && !isMatching) {
      setIsMatching(true);
      getMatchedStories()
        .then((res) => {
          setMatchedStories(res);
          setIsMatching(false);
        })
        .catch((err) => {
          console.error("Vector matching failed:", err);
          setIsMatching(false);
        });
    }
  }, [showMatchedOnly, getMatchedStories, matchedStories, isMatching]);

  const isLoadingMatched = showMatchedOnly && isMatching && !matchedStories;

  if (settings === undefined || status === "LoadingFirstPage" || isLoadingMatched) {
    return (
      <div className="flex flex-col gap-6 py-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const storiesToDisplay = showMatchedOnly ? (matchedStories || []) : stories;

  // When a tag or custom sort is active, skip shelves and show filtered list
  const showShelves = !selectedTagId && !showMatchedOnly;

  return (
    <>
      <IcpBanner />

      {/* ICP matched shelf — move to top */}
      {!selectedTagId && !showMatchedOnly && <MatchedStoriesShelf />}

      {showShelves ? (
        <>
          {/* Fresh Launches shelf */}
          {(freshLaunches === undefined || (freshLaunches && freshLaunches.length > 0)) && (
            <StoryShelf
              title="Fresh Launches"
              subtitle="Submitted in the last 48 hours"
              stories={freshLaunches ?? []}
              isLoading={freshLaunches === undefined}
              seeAllHref="/?sort=all"
              icon={<Clock className="w-4 h-4" />}
              variant="featured"
            />
          )}

          {/* Trending This Week */}
          {(trendingStories === undefined || (trendingStories && trendingStories.length > 0)) && (
            <StoryShelf
              title="Trending This Week"
              subtitle={
                <span className="flex items-center gap-1">
                  Ranked by votes + ratings + conversations{" "}
                  <Link href="/scoring" className="hover:underline" title="How ranking works">
                    <Info className="w-3 h-3 inline" />
                  </Link>
                </span> as any
              }
              stories={trendingStories ?? []}
              isLoading={trendingStories === undefined}
              seeAllHref="/leaderboard"
              icon={<Zap className="w-4 h-4" />}
            />
          )}

          {/* In Beta — Try Early */}
          {(inBeta === undefined || (inBeta && inBeta.length > 0)) && (
            <StoryShelf
              title="In Beta — Try Early"
              subtitle="Products actively looking for beta testers"
              stories={inBeta ?? []}
              isLoading={inBeta === undefined}
              seeAllHref="/explore"
              icon={<FlaskConical className="w-4 h-4" />}
            />
          )}

          {/* Divider before full feed */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">All Apps</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </>
      ) : showMatchedOnly ? (
        <div className="flex flex-col gap-1 mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Matched for you{" "}
            <span className="text-xs font-normal px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              Pro
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Semantic matching based on your ICP profile and product interests.
          </p>
        </div>
      ) : null}

      {storiesToDisplay.length === 0 && !showShelves ? (
        <div className="py-20 text-center">
          <h2 className="text-2xl font-bold mb-2">No apps found</h2>
          <p className="text-muted-foreground mb-6">
            {showMatchedOnly
              ? "We couldn't find any specific matches for your ICP profile yet. Try updating your profile!"
              : "No apps found in this category."}
          </p>
          <a
            href={showMatchedOnly ? "/user-settings/icp" : "/submit"}
            className="inline-flex items-center justify-center px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-all"
          >
            {showMatchedOnly ? "Update ICP Profile" : "Submit an App"}
          </a>
        </div>
      ) : (
        <div className="mb-6">
          <StoryList
            stories={storiesToDisplay as Story[]}
            viewMode={viewMode}
            status={showMatchedOnly ? "CanLoadMore" : status}
            loadMore={showMatchedOnly ? () => {} : loadMore}
            itemsPerPage={settings.itemsPerPage}
          />
        </div>
      )}
    </>
  );
}
