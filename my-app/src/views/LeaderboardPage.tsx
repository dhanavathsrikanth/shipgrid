"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ThumbsUp, UserCircle, Star, MessageSquare, Info, Trophy } from "lucide-react";
import { ProfileHoverCard } from "../components/ui/ProfileHoverCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Tab = "today" | "week" | "month" | "all";

const TABS: { label: string; value: Tab; sortPeriod: string; description: string }[] = [
  { label: "Today",      value: "today",  sortPeriod: "votes_today", description: "Most vibes in the last 24 hours" },
  { label: "This Week",  value: "week",   sortPeriod: "votes_week",  description: "Most vibes this week" },
  { label: "This Month", value: "month",  sortPeriod: "votes_month", description: "Most vibes this month" },
  { label: "All Time",   value: "all",    sortPeriod: "votes_all",   description: "All-time most vibed products" },
];

export function LeaderboardPage() {
  const [activeTab, setActiveTab] = React.useState<Tab>("week");
  const tab = TABS.find((t) => t.value === activeTab)!;

  const result = useQuery(api.stories.listApproved, {
    paginationOpts: { numItems: 25, cursor: null },
    sortPeriod: tab.sortPeriod as any,
  });

  const stories = result?.page ?? [];
  const isLoading = result === undefined;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h1 className="text-xl font-semibold text-foreground">Leaderboard</h1>
            </div>
            <Link
              href="/scoring"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="How is ranking calculated?"
            >
              <Info className="w-3.5 h-3.5" />
              How ranking works
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">{tab.description}</p>
        </div>

        {/* shadcn-style tab bar */}
        <div className="flex gap-1 mb-6 p-1 bg-muted rounded-lg w-fit">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === t.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Leaderboard list */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y divide-border">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
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
                <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground">No apps found for this period.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  When apps start getting vibes, they will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stories.map((story, index) => (
                  <LeaderboardItem key={story._id} story={story as any} rank={index + 1} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer note */}
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
  };
  rank: number;
}

function LeaderboardItem({ story, rank }: LeaderboardItemProps) {
  const medalVariant =
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
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${medalVariant}`}>
          {rank <= 3 ? ["🥇","🥈","🥉"][rank-1] : rank}
        </div>

        {/* Thumbnail */}
        {story.screenshotUrl && (
          <Link href={`/s/${story.slug}`} className="hidden sm:block flex-shrink-0">
            <img
              src={story.screenshotUrl}
              alt={story.title}
              className="w-12 h-9 object-cover rounded border border-border"
            />
          </Link>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/s/${story.slug}`}
            className="font-medium text-foreground hover:underline text-sm block truncate"
          >
            {story.title}
          </Link>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            {story.authorUsername ? (
              <ProfileHoverCard username={story.authorUsername}>
                <Link
                  href={`/${story.authorUsername}`}
                  className="flex items-center gap-1 hover:underline"
                >
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
                <Star className="w-3 h-3 fill-amber-400" />
                {story.averageRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Vote count */}
        <Badge variant="secondary" className="flex items-center gap-1 font-semibold">
          <ThumbsUp className="w-3 h-3" />
          {story.votes}
        </Badge>
      </div>
    </div>
  );
}
