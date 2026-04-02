"use client";

import React, { useState, useEffect } from "react";
import { usePaginatedQuery, useAction, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useLayoutContext } from "@/components/Layout";
import { StoryList } from "@/components/StoryList";
import { IcpBanner } from "@/components/IcpBanner";
import { Sparkles, Users, LayoutGrid } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import type { Story } from "@/types";

export default function BrowsePage() {
  const { viewMode } = useLayoutContext();
  const { isSignedIn } = useUser();
  const settings = useQuery(api.settings.get);
  const getMatchedStories = useAction(api.icpMatch.getMatchedStories);
  
  const [currentTab, setCurrentTab] = useState<"all" | "following" | "matched">("all");
  const [matchedStories, setMatchedStories] = useState<any[] | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  // Queries
  const allStoriesQuery = usePaginatedQuery(
    api.stories.listApproved,
    {},
    { initialNumItems: (settings?.itemsPerPage || 20) }
  );

  const followingStoriesQuery = usePaginatedQuery(
    api.stories.listFollowing,
    {},
    { initialNumItems: (settings?.itemsPerPage || 20) }
  );

  useEffect(() => {
    if (currentTab === "matched" && !matchedStories && !isMatching) {
      setIsMatching(true);
      getMatchedStories().then(res => {
        setMatchedStories(res);
        setIsMatching(false);
      }).catch(err => {
        console.error("Matched stories fetch failed:", err);
        setIsMatching(false);
      });
    }
  }, [currentTab, getMatchedStories, matchedStories, isMatching]);

  const isLoading = 
    settings === undefined || 
    (currentTab === "all" && allStoriesQuery.status === "LoadingFirstPage") ||
    (currentTab === "following" && followingStoriesQuery.status === "LoadingFirstPage") ||
    (currentTab === "matched" && isMatching && !matchedStories);

  const stories = 
    currentTab === "all" ? allStoriesQuery.results :
    currentTab === "following" ? followingStoriesQuery.results :
    (matchedStories || []);

  const status = 
    currentTab === "all" ? allStoriesQuery.status :
    currentTab === "following" ? followingStoriesQuery.status :
    "CanLoadMore";

  const loadMore = 
    currentTab === "all" ? allStoriesQuery.loadMore :
    currentTab === "following" ? followingStoriesQuery.loadMore :
    () => {};

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-12">
      <div className="space-y-4 text-center">
        {/* Geist H1 Styling: 64px, tracking-tight */}
        <h1 className="text-[48px] md:text-[64px] font-bold tracking-tight text-foreground leading-[1.1] title-font">
          Browse
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Discover the best apps built by the community, your circle, and tailored for you.
        </p>
      </div>

      <div className="flex justify-center border-b pb-0 gap-6 md:gap-12">
        <button 
          onClick={() => setCurrentTab("all")}
          className={cn(
            "flex items-center gap-2 pb-4 px-2 transition-all border-b-2",
            currentTab === "all" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutGrid size={18} />
          {/* Geist H2 Styling: 13px */}
          <span className="text-[13px] font-bold uppercase tracking-widest">All Vibes</span>
        </button>
        
        {isSignedIn && (
          <button 
            onClick={() => setCurrentTab("following")}
            className={cn(
              "flex items-center gap-2 pb-4 px-2 transition-all border-b-2",
              currentTab === "following" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Users size={18} />
            <span className="text-[13px] font-bold uppercase tracking-widest">Following</span>
          </button>
        )}

        {isSignedIn && settings?.enableIcpMatching !== false && (
          <button 
            onClick={() => setCurrentTab("matched")}
            className={cn(
              "flex items-center gap-2 pb-4 px-2 transition-all border-b-2",
              currentTab === "matched" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles size={18} />
            <span className="text-[13px] font-bold uppercase tracking-widest">For You</span>
          </button>
        )}
      </div>

      {currentTab === "matched" && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <IcpBanner />
        </div>
      )}

      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-10">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-80 bg-muted/30 animate-pulse rounded-2xl border" />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="py-24 text-center space-y-4 bg-muted/10 rounded-3xl border border-dashed border-border animate-in fade-in duration-700">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
              No entries discovered
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto text-sm">
              {currentTab === "following" 
                ? "You're not following anyone yet! Follow creators to see their ships here."
                : "The horizon is clear! No apps matched this selection yet."}
            </p>
            {currentTab === "following" && (
               <button 
                 onClick={() => setCurrentTab("all")}
                 className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-all shadow-sm"
               >
                 Discover Creators
               </button>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <StoryList
              stories={stories as any[]}
              viewMode={viewMode || "vibe"}
              status={status}
              loadMore={loadMore}
              itemsPerPage={settings?.itemsPerPage || 20}
            />
          </div>
        )}
      </div>
    </div>
  );
}
