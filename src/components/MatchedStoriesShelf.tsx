"use client";

import React from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ChevronRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function MatchedStoriesShelf() {
  const settings = useQuery(api.settings.get);
  const [matchedStories, setMatchedStories] = React.useState<any[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const getMatchedStories = useAction(api.icpMatch.getMatchedStories);

  React.useEffect(() => {
    let isMounted = true;
    async function fetchMatches() {
      try {
        const results = await getMatchedStories();
        if (isMounted) {
          setMatchedStories(results);
        }
      } catch (error) {
        console.error("Failed to fetch matched stories via vector search:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    fetchMatches();
    return () => { isMounted = false; };
  }, [getMatchedStories]);

  // Don't show if settings are loading, feature is disabled, or no matches after loading
  if (settings === undefined || settings?.enableIcpMatching === false) {
    return null;
  }

  if (!isLoading && (!matchedStories || matchedStories.length === 0)) {
    return null;
  }

  // Use a skeleton loading state
  if (isLoading) {
    return (
      <div className="mb-8 animate-pulse px-1">
        <div className="h-6 w-48 bg-muted rounded mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-none w-[280px] h-[200px] bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const storiesToDisplay = matchedStories!;

  return (
    <div className="mb-8 overflow-hidden">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Matched for You</h2>
            <p className="text-xs text-muted-foreground">AI-powered recommendations based on your profile.</p>
          </div>
        </div>
        <Link 
          href="/matched" 
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group/btn"
        >
          View all <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="relative group">
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x no-scrollbar">
          {storiesToDisplay.map((story) => (
            <Link
              key={story._id}
              href={`/s/${story.slug}`}
              className="flex-none w-[280px] snap-start"
            >
              <div className="group/card relative bg-card h-[200px] border border-border rounded-xl overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg">
                {/* Image Background */}
                <div className="absolute inset-0 z-0">
                  {story.screenshotUrl ? (
                    <Image
                      src={story.screenshotUrl}
                      alt={story.title}
                      width={280}
                      height={200}
                      sizes="280px"
                      className="w-full h-full object-cover opacity-40 group-hover/card:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted/30" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative z-10 p-4 h-full flex flex-col justify-end">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Personalized Match
                    </span>
                    {story.status === "approved" && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase">Verified</span>
                    )}
                  </div>
                  <h3 className="font-bold text-foreground truncate">{story.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{story.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Fading Edge */}
        <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-background to-transparent pointer-events-none group-hover:opacity-0 transition-opacity" />
      </div>
    </div>
  );
}
