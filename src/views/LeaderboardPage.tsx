"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ThumbsUp, UserCircle, Star, MessageSquare, Info } from "lucide-react";
import { ProfileHoverCard } from "../components/ui/ProfileHoverCard";

type Tab = "week" | "today" | "month" | "all";

const TABS: { label: string; value: Tab; description: string }[] = [
  { label: "Today", value: "today", description: "Most vibes in the last 24 hours" },
  { label: "This Week", value: "week", description: "Most vibes this week" },
  { label: "This Month", value: "month", description: "Most vibes this month" },
  { label: "All Time", value: "all", description: "All-time most vibed products" },
];

export function LeaderboardPage() {
  const [activeTab, setActiveTab] = React.useState<Tab>("week");

  const topStories = useQuery(api.stories.listApproved, {
    sortPeriod: `votes_${activeTab}` as any,
  });

  const stories = topStories?.page?.slice(0, 25) ?? [];
  const isLoading = topStories === undefined;

  const activeTabDef = TABS.find((t) => t.value === activeTab)!;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-semibold text-foreground">Leaderboard</h1>
            <Link
              href="/scoring"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="How is ranking calculated?"
            >
              <Info className="w-3.5 h-3.5" />
              How ranking works
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">{activeTabDef.description}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-muted rounded-lg w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-2 bg-muted rounded w-1/3" />
                  </div>
                  <div className="h-3 bg-muted rounded w-12" />
                </div>
              ))}
            </div>
          ) : stories.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-muted-foreground mb-2">No apps yet for this period</div>
              <p className="text-sm text-muted-foreground">
                When apps start getting vibes, they'll appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {stories.map((story, index) => (
                <LeaderboardItem key={story._id} story={story as any} rank={index + 1} />
              ))}
            </div>
          )}
        </div>

        {/* Transparency note */}
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Rankings are based on votes received in the selected time period.{" "}
          <Link href="/scoring" className="underline hover:text-foreground">
            See full ranking formula →
          </Link>
        </p>
      </div>
    </div>
  );
}

interface LeaderboardItemProps {
  story: {
    _id: string;
    title: string;
    slug: string;
    votes: number;
    commentCount?: number;
    averageRating?: number;
    authorUsername?: string | null;
    authorName?: string | null;
    screenshotUrl?: string | null;
    description?: string;
  };
  rank: number;
}

function LeaderboardItem({ story, rank }: LeaderboardItemProps) {
  const rankColor =
    rank === 1
      ? "bg-amber-400 text-white"
      : rank === 2
        ? "bg-slate-400 text-white"
        : rank === 3
          ? "bg-amber-700 text-white"
          : "bg-muted text-muted-foreground";

  return (
    <div className="p-4 hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-4">
        {/* Rank badge */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${rankColor}`}>
          {rank}
        </div>

        {/* Thumbnail */}
        {story.screenshotUrl && (
          <Link href={`/s/${story.slug}`} className="flex-shrink-0 hidden sm:block">
            <img
              src={story.screenshotUrl}
              alt={story.title}
              className="w-12 h-9 object-cover rounded border border-border"
            />
          </Link>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Link href={`/s/${story.slug}`} className="font-medium text-foreground hover:underline text-sm block truncate">
            {story.title}
          </Link>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            {story.authorUsername ? (
              <ProfileHoverCard username={story.authorUsername}>
                <Link href={`/${story.authorUsername}`} className="flex items-center gap-1 hover:underline">
                  <UserCircle className="w-3 h-3" />
                  {story.authorName || story.authorUsername}
                </Link>
              </ProfileHoverCard>
            ) : story.authorName ? (
              <span className="flex items-center gap-1">
                <UserCircle className="w-3 h-3" />
                {story.authorName}
              </span>
            ) : null}

            {story.commentCount !== undefined && story.commentCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {story.commentCount}
              </span>
            )}

            {story.averageRating !== undefined && story.averageRating > 0 && (
              <span className="flex items-center gap-0.5 text-amber-500">
                <Star className="w-3 h-3 fill-amber-500" />
                {story.averageRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Vote count */}
        <div className="flex items-center gap-1 text-sm font-semibold text-foreground flex-shrink-0">
          <ThumbsUp className="w-4 h-4 text-muted-foreground" />
          {story.votes}
        </div>
      </div>
    </div>
  );
}
