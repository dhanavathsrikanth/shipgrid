"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Sparkles, ChevronRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function MatchedStoriesShelf() {
  const settings = useQuery(api.settings.get);
  const matchedStories = useQuery(api.stories.listMatchedStories);

  // Don't show if disabled or no matches
  if (settings?.enableIcpMatching === false || !matchedStories || matchedStories.length === 0) {
    return null;
  }

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
          {matchedStories.map((story) => (
            <Link
              key={story._id}
              href={`/s/${story.slug}`}
              className="flex-none w-[280px] snap-start"
            >
              <div className="group/card relative bg-card h-[200px] border border-border rounded-xl overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg">
                {/* Image Background */}
                <div className="absolute inset-0 z-0">
                  {story.screenshotUrl ? (
                    <img 
                      src={story.screenshotUrl} 
                      alt={story.title}
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
                      <TrendingUp className="w-3 h-3" /> {story.matchScore}% Match
                    </span>
                    {story.stage === "live" && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold">LIVE</span>
                    )}
                  </div>
                  <h3 className="font-bold text-foreground truncate">{story.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{story.tagline}</p>
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
