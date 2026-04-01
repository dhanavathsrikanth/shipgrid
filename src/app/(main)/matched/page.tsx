"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Sparkles, ChevronLeft, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MatchedPage() {
  const matchedStories = useQuery(api.stories.listMatchedStories);
  const user = useQuery(api.users.getMyUserDocument);

  if (matchedStories === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-tight animate-pulse text-muted-foreground">Syncing Personalized Discoveries...</p>
      </div>
    );
  }

  return (
    <div className="container px-4 mx-auto py-12 max-w-6xl min-h-[80vh]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 border border-border hover:bg-muted" asChild>
            <Link href="/"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-primary" />
              <h1 className="text-3xl font-extrabold tracking-tight title-font text-foreground italic">
                Matched for {user?.username || "You"}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Intelligence-driven results optimized for your professional profile.
            </p>
          </div>
        </div>
        
        <Button size="sm" variant="outline" className="rounded-xl font-bold border-primary/20 hover:bg-primary/5 text-primary" asChild>
          <Link href="/personalize">Modify My Persona</Link>
        </Button>
      </div>

      {!matchedStories || matchedStories.length === 0 ? (
        <div className="text-center py-24 bg-muted/20 border border-dashed border-border rounded-[32px] px-6">
          <div className="p-4 rounded-2xl bg-muted w-fit mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-xl font-bold mb-2">No precision matches found.</h2>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Our engines need a bit more data to find your perfect matches. Try updating your builder profile.
          </p>
          <Button asChild className="rounded-xl px-8 h-12 font-bold shadow-xl shadow-primary/20">
            <Link href="/personalize">Fix My Persona</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {matchedStories.map((story) => (
            <Link
              key={story._id}
              href={`/s/${story.slug}`}
              className="group/card relative block h-full transition-all hover:-translate-y-2"
            >
              <div className="bg-card border border-border rounded-[32px] overflow-hidden h-full flex flex-col shadow-sm transition-all group-hover/card:border-primary/50 group-hover/card:shadow-2xl group-hover/card:shadow-primary/5 p-2">
                {/* Visual Area */}
                <div className="relative h-56 overflow-hidden rounded-[24px] bg-muted shadow-inner">
                  {story.screenshotUrl ? (
                    <img 
                      src={story.screenshotUrl} 
                      alt={story.title}
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                      <Sparkles className="w-12 h-12" />
                    </div>
                  )}
                  {/* Dynamic Match Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <div className="px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-white/5 shadow-2xl flex items-center gap-2">
                      <div className="relative">
                        <TrendingUp className="w-3.5 h-3.5 text-primary" />
                        <span className="absolute inset-0 bg-primary/20 blur-sm animate-pulse" />
                      </div>
                      <span className="text-[11px] font-extrabold text-foreground tracking-tight">
                        {story.matchScore}% PRECISION
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-md bg-muted text-[9px] font-black uppercase tracking-widest text-muted-foreground border border-border/50">
                      {story.stage || "BUILDING"}
                    </span>
                    {story.votes > 20 && (
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-[9px] font-black uppercase tracking-widest text-primary border border-primary/10">
                        VIBING
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-foreground title-font group-hover/card:text-primary transition-colors">
                    {story.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground font-medium line-clamp-3 mb-6 flex-1 leading-relaxed">
                    {story.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live Now</span>
                    </div>
                    <div className="text-primary text-xs font-black uppercase tracking-[0.1em] group-hover/card:translate-x-1 transition-transform">
                      View Story →
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {/* Footer Support */}
      <div className="mt-20 p-8 rounded-[32px] bg-primary/5 border border-primary/10 text-center">
        <h4 className="text-lg font-bold mb-2 text-foreground">Want more curated discoveries?</h4>
        <p className="text-sm text-muted-foreground mb-6">Our engine learns from your engagement. Keep upvoting to improve results.</p>
        <Button variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/5 text-primary font-bold" asChild>
          <Link href="/">Back to Feed</Link>
        </Button>
      </div>
    </div>
  );
}
