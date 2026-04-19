"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, ChevronUp, Star, MessageSquare, Zap, Clock, ArrowLeftRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { StageBadge } from "./StageBadge";

interface ShelfStory {
  _id: string;
  _creationTime: number;
  title: string;
  slug: string;
  description?: string;
  votes: number;
  commentCount?: number;
  screenshotUrl?: string | null;
  averageRating?: number;
  trendingScore?: number;
  stage?: string;
  tags?: Array<{
    _id: string;
    name: string;
    slug?: string | null;
    backgroundColor?: string;
    textColor?: string;
  }>;
  authorName?: string;
  authorUsername?: string | null;
}

interface StoryShelfProps {
  title: string;
  subtitle?: string;
  stories: ShelfStory[];
  seeAllHref?: string;
  isLoading?: boolean;
  icon?: React.ReactNode;
  variant?: "default" | "compact" | "featured";
}

export function StoryShelf({
  title,
  subtitle,
  stories,
  seeAllHref,
  isLoading = false,
  icon,
  variant = "default",
}: StoryShelfProps) {
  return (
    <section className="mb-10">
      {/* Shelf header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            {icon && <span className="text-primary">{icon}</span>}
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            See all <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Skeleton loading */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg p-3 animate-pulse"
            >
              <div className="w-full h-28 bg-muted rounded mb-3" />
              <div className="h-3 bg-muted rounded w-3/4 mb-2" />
              <div className="h-2 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          Nothing here yet — check back soon.
        </div>
      ) : variant === "featured" ? (
        /* Featured layout: first card large, rest stacked */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {stories[0] && (
            <Link
              href={`/s/${stories[0].slug}`}
              className="lg:col-span-1 group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 transition-all hover:shadow-md"
            >
              {stories[0].screenshotUrl && (
                <div className="relative overflow-hidden">
                  <img
                    src={stories[0].screenshotUrl}
                    alt={stories[0].title}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-3">
                <p className="font-semibold text-sm text-foreground group-hover:underline line-clamp-1">
                  {stories[0].title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {stories[0].description}
                </p>
                <StoryMeta story={stories[0]} />
              </div>
            </Link>
          )}
          <div className="lg:col-span-2 flex flex-col gap-2">
            {stories.slice(1, 5).map((story) => (
              <CompactRow key={story._id} story={story} />
            ))}
          </div>
        </div>
      ) : (
        /* Default card grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stories.slice(0, 8).map((story) => (
            <StoryCard key={story._id} story={story} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ---- Card ---- */
function StoryCard({ story }: { story: ShelfStory }) {
  return (
    <div className="group relative bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 transition-all hover:shadow-md">
      <Link href={`/s/${story.slug}`} className="block">
        {story.screenshotUrl ? (
          <div className="overflow-hidden">
            <img
              src={story.screenshotUrl}
              alt={story.title}
              className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-28 bg-muted flex items-center justify-center">
            <span className="text-2xl text-muted-foreground/40">📦</span>
          </div>
        )}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm text-foreground group-hover:underline line-clamp-1">
              {story.title}
            </p>
            {story.stage && <StageBadge stage={story.stage} />}
          </div>
          {story.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {story.description}
            </p>
          )}
          <StoryMeta story={story} />
        </div>
      </Link>
      
      {/* Hover Compare Button */}
      <Link
        href={`/compare/${story.slug}-vs-competitor`}
        className="absolute top-2 right-2 p-1.5 bg-background/90 backdrop-blur-sm border border-border rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground z-10"
        title="Compare"
        onClick={(e) => e.stopPropagation()}
      >
        <ArrowLeftRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

/* ---- Compact row (for featured shelf sidebar) ---- */
function CompactRow({ story }: { story: ShelfStory }) {
  return (
    <Link
      href={`/s/${story.slug}`}
      className="group flex items-center gap-3 bg-card border border-border rounded-lg p-2.5 hover:border-primary/40 transition-all"
    >
      {story.screenshotUrl && (
        <img
          src={story.screenshotUrl}
          alt={story.title}
          className="w-12 h-9 object-cover rounded flex-shrink-0 border border-border"
          loading="lazy"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground group-hover:underline truncate">
            {story.title}
          </p>
          {story.stage && <StageBadge stage={story.stage} />}
        </div>
        <p className="text-xs text-muted-foreground truncate">{story.description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
        <ChevronUp className="w-3 h-3" />
        {story.votes}
      </div>
    </Link>
  );
}

/* ---- Meta row ---- */
function StoryMeta({ story }: { story: ShelfStory }) {
  return (
    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-0.5">
        <ChevronUp className="w-3 h-3" />
        {story.votes}
      </span>
      {story.commentCount !== undefined && story.commentCount > 0 && (
        <span className="flex items-center gap-0.5">
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
      {story._creationTime && (
        <span className="ml-auto">
          {formatDistanceToNow(story._creationTime)} ago
        </span>
      )}
    </div>
  );
}
