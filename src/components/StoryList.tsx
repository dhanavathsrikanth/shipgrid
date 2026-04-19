"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronUp,
  MessageSquare,
  ArrowDown,
  Github,
  Pin,
  Bookmark,
  BookmarkCheck,
  Star,
  Info,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Story } from "../types";
import { UsePaginatedQueryResult, useMutation, useQuery } from "convex/react";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { AuthRequiredDialog } from "./ui/AuthRequiredDialog";
import { ProfileHoverCard } from "./ui/ProfileHoverCard";
import { useDialog } from "../hooks/useDialog";
import { StageBadge } from "./StageBadge";

interface StoryListProps {
  stories: Story[];
  viewMode: "list" | "grid" | "vibe";
  status: UsePaginatedQueryResult<any>["status"];
  loadMore: UsePaginatedQueryResult<any>["loadMore"];
  itemsPerPage: number;
}

const BookmarkButton = ({
  storyId,
  onAuthRequired,
  showMessage,
}: {
  storyId: Id<"stories">;
  onAuthRequired: () => void;
  showMessage: (
    title: string,
    message: string,
    variant: "info" | "success" | "warning" | "error",
  ) => void;
}) => {
  const { isSignedIn } = useAuth();
  const isBookmarked = useQuery(
    api.bookmarks.isStoryBookmarked,
    isSignedIn ? { storyId } : "skip",
  );
  const addOrRemoveBookmarkMutation = useMutation(
    api.bookmarks.addOrRemoveBookmark,
  );

  const handleBookmarkClick = async () => {
    if (!isSignedIn) {
      onAuthRequired();
      return;
    }
    try {
      await addOrRemoveBookmarkMutation({ storyId });
    } catch (error) {
      console.error("Failed to update bookmark:", error);
      showMessage(
        "Bookmark Error",
        "Failed to update bookmark. Please try again.",
        "error",
      );
    }
  };

  if (!isSignedIn) {
    return (
      <button
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-not-allowed"
        title="Sign in to bookmark"
      >
        <Bookmark className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleBookmarkClick}
      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      title={isBookmarked ? "Remove bookmark" : "Bookmark story"}
    >
      {isBookmarked ? (
        <BookmarkCheck className="w-4 h-4 text-foreground" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
    </button>
  );
};

export function StoryList({
  stories,
  viewMode,
  status,
  loadMore,
  itemsPerPage,
}: StoryListProps) {
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();
  const voteStory = useMutation(api.stories.voteStory);
  const { showMessage, DialogComponents } = useDialog();

  // Auth required dialog state
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);
  const [authDialogAction, setAuthDialogAction] = React.useState("");

  const handleVote = (storyId: Id<"stories">) => {
    if (!isClerkLoaded) return;

    if (!isSignedIn) {
      setAuthDialogAction("vote");
      setShowAuthDialog(true);
      return;
    }

    voteStory({ storyId });
  };

  const containerClass =
    viewMode === "grid"
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      : viewMode === "vibe"
        ? "flex flex-col space-y-6"
        : "space-y-4";

  const formatDate = (creationTime: number) => {
    try {
      return formatDistanceToNow(creationTime) + " ago";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date not available";
    }
  };

  // Comment quality engagement dot
  const getCommentQualityDot = (story: Story) => {
    const votes = (story as any).votesCount ?? story.votes ?? 1;
    const comments = story.commentCount ?? 0;
    const ratio = votes > 0 ? comments / votes : 0;
    if (ratio >= 0.10) return { color: "bg-emerald-500", label: "Active Discussion" };
    if (ratio >= 0.03) return { color: "bg-amber-400", label: "Some Discussion" };
    return null; // don't show dot for very low ratio — avoids noise
  };

  // Rating stars helper
  const renderRating = (rating: number) => {
    if (!rating || rating === 0) return null;
    return (
      <span className="flex items-center gap-0.5 text-amber-500" title={`${rating}/10 avg rating`}>
        <Star className="w-3 h-3 fill-amber-500" />
        <span className="text-xs font-medium text-muted-foreground">{rating.toFixed(1)}</span>
      </span>
    );
  };

  const mainContentContainerClass =
    viewMode === "vibe" ? "flex-grow" : "w-full";

  return (
    <>
      <DialogComponents />
      <div
        className={`flex ${viewMode === "vibe" ? "flex-row gap-6" : "flex-col"}`}
      >
        <div className={mainContentContainerClass}>
          <div className="space-y-8">
            <div className={containerClass}>
              {stories.map((story) => (
                <article
                  key={story._id}
                  className={`flex ${viewMode === "grid" ? "flex-col bg-card rounded-lg p-4 border border-border" : viewMode === "vibe" ? "flex-col md:flex-row items-start" : "flex-row bg-card rounded-lg p-[4px] border border-border"} gap-4`}
                >
                  {viewMode !== "grid" && (
                    <div
                      className={`flex ${
                        viewMode === "vibe"
                          ? "flex-col items-center w-[70px] flex-shrink-0"
                          : "flex-col items-center min-w-[40px] pt-1"
                      }`}
                    >
                    {viewMode === "vibe" ? (
                        <div className="flex flex-col items-center w-full">
                          <div className="bg-muted/50 rounded-t-md w-full h-[62px] flex flex-col items-center justify-center text-lg border border-border font-normal text-foreground mb-[0px]">
                            <span className="font-alfa-slab-one">
                              {story.votes}
                            </span>
                            <div className="text-xs">Vibes</div>
                          </div>
                          <div className="relative group">
                            <button
                              onClick={() => handleVote(story._id)}
                              className="bg-card border border-t-0 border-border text-foreground hover:bg-muted/80 w-full rounded-b-md py-1 px-2 flex items-center justify-center gap-1 text-sm font-normal h-[24px] transition-colors"
                            >
                              Vibe it
                            </button>
                            <Link
                              href="/scoring"
                              className="absolute -right-5 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="How ranking works"
                            >
                              <Info className="w-3 h-3 text-muted-foreground" />
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="relative group">
                            <button
                              onClick={() => handleVote(story._id)}
                              className="text-foreground hover:bg-muted p-1 rounded"
                            >
                              <ChevronUp className="w-5 h-5" />
                            </button>
                            <div className="absolute left-full top-0 ml-1 hidden group-hover:flex items-center">
                              <Link href="/scoring" title="How is ranking calculated?">
                                <Info className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                              </Link>
                            </div>
                          </div>
                          <span className="text-foreground font-medium text-sm">
                            {story.votes}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* THUMBNAIL - Vibe view only */}
                  {viewMode === "vibe" && story.screenshotUrl && (
                    <Link
                      href={`/s/${story.slug}`}
                      className="w-full md:w-[195px] md:flex-shrink-0 aspect-video block overflow-hidden rounded-md"
                    >
                      <img
                        src={story.screenshotUrl}
                        alt={`${story.title} thumbnail`}
                        className="w-full h-full object-cover border border-border shadow-sm"
                        loading="lazy"
                      />
                    </Link>
                  )}

                  {/* STORY CONTENT - Apply bg/border for vibe mode, padding in inner div */}
                  <div
                    className={`flex-1 min-w-0 ${viewMode === "vibe" ? "bg-card rounded-md border border-border" : ""}`}
                  >
                    <div
                      className={
                        viewMode === "vibe" || viewMode === "list"
                          ? "p-[4px]"
                          : ""
                      }
                    >
                      {story.customMessage && (
                        <div
                          className="mb-2 text-xs text-primary-foreground bg-foreground/90 border border-border rounded-md p-2 italic shadow-sm"
                        >
                          {story.customMessage}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        {story.isPinned && (
                          <Pin
                            className={`${viewMode === "list" ? "w-3.5 h-3.5" : "w-3.5 h-3.5"} text-muted-foreground flex-shrink-0`}
                            aria-label="Pinned Story"
                          />
                        )}
                        {viewMode === "grid" && (
                          <>
                            <button
                              onClick={() => handleVote(story._id)}
                              className="text-foreground hover:bg-muted p-1 rounded"
                            >
                              <ChevronUp className="w-5 h-5" />
                            </button>
                            <span className="text-foreground font-medium text-sm">
                              {story.votes}
                            </span>
                          </>
                        )}
                        <h2
                          className={`${viewMode === "vibe" || viewMode === "list" ? "text-[15px]" : "text-base"} text-foreground font-bold truncate flex items-center gap-2`}
                        >
                          <Link
                            href={`/s/${story.slug}`}
                            className="hover:text-foreground break-words"
                          >
                            {story.title}
                          </Link>
                          {story.stage && (
                            <div className="flex-shrink-0">
                                <StageBadge stage={story.stage} betaOpenedAt={story.betaOpenedAt} />
                            </div>
                          )}
                        </h2>
                      </div>
                      {viewMode === "vibe" && (
                        <p className="text-foreground text-[13px] leading-[18px] mb-1.5 line-clamp-2">
                          {story.description}
                        </p>
                      )}
                      {viewMode === "grid" && story.screenshotUrl && (
                        <Link
                          href={`/s/${story.slug}`}
                          className="block mb-4 rounded-md overflow-hidden hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={story.screenshotUrl}
                            alt={story.title}
                            className="w-full h-48 object-cover"
                            loading="lazy"
                          />
                        </Link>
                      )}
                      {viewMode === "list" && (
                        <p className="text-foreground text-[13px] leading-[18px] mb-1.5 line-clamp-2">
                          {story.description}
                        </p>
                      )}
                      {viewMode === "grid" && (
                        <p className="text-foreground text-[14px] leading-[20px] mb-2 line-clamp-3">
                          {story.description}
                        </p>
                      )}

                      {/* Tags */}
                      {story.tags && story.tags.length > 0 && (
                        <div
                          className={`flex flex-wrap gap-1 ${viewMode === "vibe" || viewMode === "list" ? "mb-1.5" : "mb-2"}`}
                        >
                          {story.tags
                            .filter(
                              (tag: Doc<"tags">) =>
                                !tag.isHidden &&
                                tag.name !== "resendhackathon" &&
                                tag.name !== "ychackathon",
                            )
                            .map((tag: Doc<"tags">) => (
                              <Link
                                key={tag._id}
                                href={`/tag/${tag.slug}`}
                                className={`inline-flex items-center ${viewMode === "vibe" || viewMode === "list" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs"} rounded font-medium transition-colors hover:opacity-80`}
                                style={{
                                  backgroundColor:
                                    tag.backgroundColor || "var(--muted)",
                                  color: tag.textColor || "var(--foreground)",
                                  border: `1px solid ${tag.borderColor || (tag.backgroundColor ? "transparent" : "var(--border)")}`,
                                }}
                                title={`View all apps tagged with ${tag.name}`}
                              >
                                {tag.emoji && (
                                  <span className="mr-1">{tag.emoji}</span>
                                )}
                                {tag.iconUrl && !tag.emoji && (
                                  <img
                                    src={tag.iconUrl}
                                    alt=""
                                    className={`${viewMode === "vibe" || viewMode === "list" ? "w-2.5 h-2.5" : "w-3 h-3"} mr-1 rounded-sm object-cover`}
                                  />
                                )}
                                {tag.name}
                              </Link>
                            ))}
                        </div>
                      )}

                      <div
                        className={`flex items-center gap-2 ${viewMode === "vibe" || viewMode === "list" ? "text-xs" : "text-sm"} text-muted-foreground flex-wrap`}
                      >
                        {story.authorUsername ? (
                          <ProfileHoverCard username={story.authorUsername}>
                            <Link
                              href={`/${story.authorUsername}`}
                              className="hover:text-muted-foreground hover:underline"
                            >
                              by{" "}
                              {story.submitterName ||
                                story.authorName ||
                                story.authorUsername}
                            </Link>
                          </ProfileHoverCard>
                        ) : (
                          <span>
                            by{" "}
                            {story.submitterName ||
                              story.authorName ||
                              "Anonymous User"}
                          </span>
                        )}
                        <span>{formatDate(story._creationTime)}</span>

                        {/* Comment count with quality dot */}
                        <Link
                          href={`/s/${story.slug}#comments`}
                          className="flex items-center gap-1 hover:text-muted-foreground"
                        >
                          {(() => {
                            const dot = getCommentQualityDot(story);
                            return dot ? (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${dot.color} inline-block`}
                                title={dot.label}
                              />
                            ) : null;
                          })()}
                          <MessageSquare
                            className={`${viewMode === "vibe" || viewMode === "list" ? "w-3.5 h-3.5" : "w-4 h-4"}`}
                          />
                          {story.commentCount}
                        </Link>

                        {/* Average rating */}
                        {renderRating((story as any).averageRating)}

                        <BookmarkButton
                          storyId={story._id}
                          showMessage={showMessage}
                          onAuthRequired={() => {
                            setAuthDialogAction("bookmark");
                            setShowAuthDialog(true);
                          }}
                        />
                        {story.githubUrl && (
                          <a
                            href={story.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                            title="View GitHub Repo"
                          >
                            <Github
                              className={`${viewMode === "vibe" || viewMode === "list" ? "w-3.5 h-3.5" : "w-4 h-4"}`}
                            />
                            <span>Repo</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {(status === "CanLoadMore" || status === "LoadingMore") && (
              <div className="text-center mt-8">
                <button
                  onClick={() => loadMore(itemsPerPage)}
                  className="px-4 py-2 bg-card text-foreground border border-border rounded-md hover:bg-muted transition-all flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  disabled={status === "LoadingMore"}
                >
                  {status === "LoadingMore" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More
                      <ArrowDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
            {status === "Exhausted" && stories.length > 0 && (
              <div className="text-center mt-8 text-muted-foreground"></div>
            )}
          </div>
        </div>

        {/* {viewMode === "vibe" && (
        <aside className="w-80 flex-shrink-0 space-y-6 hidden lg:block">
          <WeeklyLeaderboard />
          <TopCategoriesOfWeek />
        </aside>
      )} */}

        {/* Auth Required Dialog */}
        <AuthRequiredDialog
          isOpen={showAuthDialog}
          onClose={() => setShowAuthDialog(false)}
          action={authDialogAction}
        />
      </div>
    </>
  );
}



