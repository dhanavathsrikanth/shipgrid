"use client";

import React, { useEffect, useState } from "react";
import { usePaginatedQuery, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MatchedStoriesShelf } from "@/components/MatchedStoriesShelf";
import { IcpBanner } from "@/components/IcpBanner";
import { StoryList } from "@/components/StoryList";
import { useLayoutContext } from "@/components/Layout";
import type { Story } from "@/types";

export default function HomePage() {
  const { viewMode, selectedTagId, sortPeriod, showMatchedOnly } = useLayoutContext();
  const settings = useQuery(api.settings.get);
  const getMatchedStories = useAction(api.icpMatch.getMatchedStories);
  
  const [matchedStories, setMatchedStories] = useState<any[] | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  const {
    results: stories,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.stories.listApproved,
    { tagId: selectedTagId, sortPeriod: sortPeriod },
    { initialNumItems: (settings?.itemsPerPage || 20) },
  );

  useEffect(() => {
    if (showMatchedOnly && !matchedStories && !isMatching) {
      setIsMatching(true);
      getMatchedStories().then(res => {
        setMatchedStories(res);
        setIsMatching(false);
      }).catch(err => {
        console.error("Vector matching failed:", err);
        setIsMatching(false);
      });
    }
  }, [showMatchedOnly, getMatchedStories, matchedStories, isMatching]);

  // If we just clicked "Matched" and are loading
  const isLoadingMatched = showMatchedOnly && isMatching && !matchedStories;

  if (settings === undefined || status === "LoadingFirstPage" || isLoadingMatched) {
    return (
      <div className="flex flex-col gap-6 py-8">
         <div className="h-64 w-full bg-muted animate-pulse rounded-2xl" />
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1,2,3,4,5,6].map(i => (
             <div key={i} className="h-80 bg-muted animate-pulse rounded-xl" />
           ))}
         </div>
      </div>
    );
  }

  const storiesToDisplay = showMatchedOnly ? (matchedStories || []) : stories;

  if (!storiesToDisplay || storiesToDisplay.length === 0) {
    return (
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
    );
  }

  return (
    <>
      <IcpBanner />
      {!selectedTagId && !showMatchedOnly && <MatchedStoriesShelf />}
      
      <div className="mb-6">
        {showMatchedOnly && (
          <div className="flex flex-col gap-1 mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Matched for you <span className="text-xs font-normal px-2 py-0.5 bg-primary/10 text-primary rounded-full">Pro</span>
            </h1>
            <p className="text-muted-foreground text-sm">Semantic matching based on your ICP profile and product interests.</p>
          </div>
        )}
        
        <StoryList
          stories={storiesToDisplay as Story[]}
          viewMode={viewMode}
          status={showMatchedOnly ? "CanLoadMore" : status}
          loadMore={showMatchedOnly ? () => {} : loadMore}
          itemsPerPage={settings.itemsPerPage}
        />
      </div>
    </>
  );
}
