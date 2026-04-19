"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import {
  BarChart2,
  Eye,
  ChevronUp,
  Star,
  MessageSquare,
  Bookmark,
  Users,
  HeartHandshake,
  Zap,
  Target,
  ChevronLeft,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StoryAnalyticsPage() {
  const params = useParams();
  const slug = (params?.storySlug ?? params?.slug) as string;

  const story = useQuery(api.stories.getBySlug, slug ? { slug } : "skip");
  const analytics = useQuery(
    api.analytics.getStoryAnalytics,
    story?._id ? { storyId: story._id } : "skip",
  );

  if (story === undefined || analytics === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-8 w-64 bg-muted animate-pulse rounded mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (story === null) return notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/s/${slug}`}
          className="p-1.5 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Builder Analytics</h1>
          </div>
          <p className="text-sm text-muted-foreground">{story.title}</p>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { icon: Eye,           label: "Total Views",    value: analytics.totalViews,    sub: `${analytics.uniqueViews} unique` },
          { icon: ChevronUp,     label: "Votes",          value: analytics.totalVotes,    sub: "vibes" },
          { icon: Star,          label: "Avg Rating",     value: analytics.avgRating > 0 ? `${analytics.avgRating}/10` : "–", sub: `${analytics.ratingCount} ratings` },
          { icon: MessageSquare, label: "Comments",       value: analytics.totalComments, sub: `${analytics.commentQuality.high} high quality` },
          { icon: Target,        label: "ICP Match Rate", value: `${analytics.icpMatchRate}%`, sub: "of viewers match ICP" },
          { icon: HeartHandshake,label: "Interested",     value: analytics.interestedCount, sub: "clicked Interested" },
          { icon: Bookmark,      label: "Bookmarks",      value: analytics.bookmarkCount, sub: "saved" },
          { icon: Users,         label: "Followers",      value: analytics.followerCount, sub: "for updates" },
        ].map(({ icon: Icon, label, value, sub }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs">{label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trending score */}
      {analytics.trendingScore !== undefined && analytics.trendingScore > 0 && (
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="pt-4 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">
                Trending Score: <strong>{analytics.trendingScore.toFixed(2)}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Computed hourly. Higher = more visibility in Trending.{" "}
                <Link href="/scoring" className="underline hover:text-foreground">
                  See formula →
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Views chart */}
      {Object.keys(analytics.viewsByDay).length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            Views — Last 30 Days
          </h2>
          <MiniBarChart data={analytics.viewsByDay} color="bg-primary" />
        </section>
      )}

      {/* Vote velocity chart */}
      {Object.keys(analytics.votesByDay).length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
            Vote Velocity — Last 30 Days
          </h2>
          <MiniBarChart data={analytics.votesByDay} color="bg-emerald-500" />
        </section>
      )}

      {/* Comment quality */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          Comment Quality
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "High Quality",   value: analytics.commentQuality.high,           className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Medium",         value: analytics.commentQuality.medium,         className: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
            { label: "Low / Short",    value: analytics.commentQuality.low,            className: "text-muted-foreground bg-muted" },
            { label: "Maker Replies",  value: analytics.commentQuality.makerResponses, className: "text-violet-600 bg-violet-50 dark:bg-violet-900/20" },
          ].map(({ label, value, className }) => (
            <div key={label} className={`rounded-lg px-4 py-3 ${className}`}>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs mt-0.5 opacity-80">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ICP Audience breakdown */}
      {(Object.keys(analytics.roleCounts).length > 0 || Object.keys(analytics.problemCounts).length > 0) && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            ICP Audience Breakdown
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(analytics.roleCounts).length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Roles</p>
                </CardHeader>
                <CardContent>
                  {(Object.entries(analytics.roleCounts) as [string, number][])
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([role, count]) => (
                      <div key={role} className="flex items-center justify-between py-0.5 text-sm">
                        <span className="text-foreground">{role}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
            {Object.keys(analytics.problemCounts).length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Challenges</p>
                </CardHeader>
                <CardContent>
                  {(Object.entries(analytics.problemCounts) as [string, number][])
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([problem, count]) => (
                      <div key={problem} className="flex items-center justify-between py-0.5 text-sm">
                        <span className="text-foreground">{problem}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      <p className="text-xs text-muted-foreground text-center mt-8">
        Analytics are owner-only and updated in real time.{" "}
        <Link href={`/s/${slug}`} className="underline hover:text-foreground">
          ← Back to product page
        </Link>
      </p>
    </div>
  );
}

/* ---- Mini bar chart (pure CSS, no chart lib) ---- */
function MiniBarChart({
  data,
  color = "bg-primary",
}: {
  data: Record<string, number>;
  color?: string;
}) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="flex items-end gap-0.5 h-16 bg-muted/30 rounded-lg px-2 py-1">
      {entries.map(([day, count]) => (
        <div
          key={day}
          className="flex-1 group relative"
          title={`${day}: ${count}`}
        >
          <div
            className={`w-full ${color} rounded-sm transition-all`}
            style={{ height: `${Math.max(2, (count / max) * 52)}px` }}
          />
        </div>
      ))}
    </div>
  );
}
