"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronUp,
  MessageSquare,
  ChevronDown,
  MoreHorizontal,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import type { Comment as CommentType } from "../types";
import ReactMarkdown from "react-markdown";
import { Id } from "../../convex/_generated/dataModel";
import Link from "next/link";
import { renderTextWithMentions } from "../utils/mentions";
import { ProfileHoverCard } from "./ui/ProfileHoverCard";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { CommentForm } from "./CommentForm";

interface CommentProps {
  comment: CommentType & { votes: number };
  onReply: (parentId: Id<"comments">) => void;
  storyOwnerId?: Id<"users"> | null;
  currentUserId?: Id<"users"> | null;
  replyingToId?: Id<"comments"> | null;
  onSubmitReply?: (content: string, parentId?: Id<"comments">) => Promise<void>;
  onCancelReply?: () => void;
  childComments?: CommentType[];
  depth?: number;
}

export function Comment({
  comment,
  onReply,
  storyOwnerId,
  currentUserId,
  replyingToId,
  onSubmitReply,
  onCancelReply,
  childComments = [],
  depth = 0,
}: CommentProps) {
  const { isSignedIn } = useAuth();
  const [collapsed, setCollapsed] = React.useState(
    comment.flaggedAsLowQuality === true,
  );
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isVoting, setIsVoting] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const voteOnComment = useMutation(api.comments.voteOnComment);
  const deleteOwnComment = useMutation(api.comments.deleteOwnComment);

  // Optimistic local state for vote
  const [localVoted, setLocalVoted] = React.useState<boolean>(
    !!comment.hasVoted,
  );
  const [localVotes, setLocalVotes] = React.useState<number>(
    comment.votes ?? 0,
  );

  React.useEffect(() => {
    setLocalVoted(!!comment.hasVoted);
    setLocalVotes(comment.votes ?? 0);
  }, [comment.hasVoted, comment.votes]);

  // Close menu on outside click
  React.useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const authorDisplayName = comment.authorName || "Anonymous";
  const authorProfileUrl = comment.authorUsername
    ? `/${comment.authorUsername}`
    : null;

  const isMaker =
    comment.isMakerResponse === true ||
    (storyOwnerId && comment.userId === storyOwnerId);
  const isVerified = comment.authorIsVerified === true;
  const isOwner = currentUserId && comment.userId === currentUserId;
  const isDeleted = comment.isDeleted === true;

  // Avatar initials fallback
  const initials = authorDisplayName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleVote = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to vote");
      return;
    }
    if (isVoting) return;

    // Optimistic update
    const newVoted = !localVoted;
    setLocalVoted(newVoted);
    setLocalVotes((v) => (newVoted ? v + 1 : Math.max(0, v - 1)));
    setIsVoting(true);

    try {
      await voteOnComment({ commentId: comment._id });
    } catch (err: any) {
      // Revert
      setLocalVoted(!newVoted);
      setLocalVotes((v) => (newVoted ? Math.max(0, v - 1) : v + 1));
      toast.error(err?.message || "Failed to vote");
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await deleteOwnComment({ commentId: comment._id });
      toast.success("Comment deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete");
    }
    setMenuOpen(false);
  };

  // Avatar component
  const Avatar = (
    <div className="flex-shrink-0 relative">
      {comment.authorImageUrl ? (
        <img
          src={comment.authorImageUrl}
          alt={authorDisplayName}
          className="w-9 h-9 rounded-full object-cover bg-muted"
          loading="lazy"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
          {initials || "?"}
        </div>
      )}
      {isVerified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5"
          title="Verified user"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />
        </span>
      )}
    </div>
  );

  // Render deleted comment placeholder
  if (isDeleted) {
    return (
      <div className={depth > 0 ? "ml-11 mt-3" : "mt-3"}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
          <div className="flex-1 pt-2">
            <p className="text-sm italic text-muted-foreground">
              This comment has been deleted by the user.
            </p>
          </div>
        </div>
        {/* Render replies under deleted parent */}
        {childComments.length > 0 && (
          <div className="mt-3">
            {childComments.map((child) => (
              <Comment
                key={child._id}
                comment={child as any}
                onReply={onReply}
                storyOwnerId={storyOwnerId}
                currentUserId={currentUserId}
                replyingToId={replyingToId}
                onSubmitReply={onSubmitReply}
                onCancelReply={onCancelReply}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render collapsed (low-quality) view
  if (collapsed) {
    return (
      <div className={depth > 0 ? "ml-11 mt-3" : "mt-3"}>
        <button
          onClick={() => setCollapsed(false)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          <span className="italic">
            Short comment from {authorDisplayName}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={depth > 0 ? "ml-11 mt-4" : "mt-4"}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {authorProfileUrl && comment.authorUsername ? (
          <ProfileHoverCard username={comment.authorUsername}>
            <Link href={authorProfileUrl}>{Avatar}</Link>
          </ProfileHoverCard>
        ) : (
          Avatar
        )}

        {/* Content column */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap">
            {authorProfileUrl && comment.authorUsername ? (
              <ProfileHoverCard username={comment.authorUsername}>
                <Link
                  href={authorProfileUrl}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {authorDisplayName}
                </Link>
              </ProfileHoverCard>
            ) : (
              <span className="text-sm font-semibold text-foreground">
                {authorDisplayName}
              </span>
            )}

            <span
              className="text-xs text-muted-foreground"
              suppressHydrationWarning
            >
              {formatDistanceToNow(comment._creationTime).replace(
                "about ",
                "",
              )}
            </span>

            {isMaker && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground font-medium">
                  Creator
                </span>
              </>
            )}
          </div>

          {/* Comment body */}
          <div className="mt-1 prose prose-sm max-w-none text-foreground/90 break-words">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="!my-1 leading-relaxed">
                    {renderTextWithMentions(String(children))}
                  </p>
                ),
                text: ({ children }) => (
                  <>{renderTextWithMentions(String(children))}</>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {comment.content}
            </ReactMarkdown>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-1 mt-2 -ml-2">
            {/* Like button */}
            <button
              onClick={handleVote}
              disabled={isVoting}
              className={`group flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                localVoted
                  ? "text-primary bg-primary/10 hover:bg-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              } ${isVoting ? "opacity-60" : ""}`}
              title={isSignedIn ? "Like" : "Sign in to like"}
            >
              <ChevronUp
                className={`w-3.5 h-3.5 transition-transform ${
                  localVoted ? "fill-current" : ""
                } group-hover:-translate-y-0.5`}
              />
              <span>Like</span>
              {localVotes > 0 && (
                <>
                  <span className="opacity-60">·</span>
                  <span>{localVotes}</span>
                </>
              )}
            </button>

            {/* Reply button */}
            <button
              onClick={() => onReply(comment._id)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>

            {/* More menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center px-1.5 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                aria-label="More options"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <div className="absolute left-0 top-full mt-1 z-20 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
                  {isOwner && (
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
                  {!isOwner && (
                    <div className="px-3 py-1.5 text-xs text-muted-foreground">
                      No actions available
                    </div>
                  )}
                </div>
              )}
            </div>

            {comment.flaggedAsLowQuality && (
              <button
                onClick={() => setCollapsed(true)}
                className="px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                collapse
              </button>
            )}
          </div>

          {/* Inline reply form */}
          {replyingToId === comment._id && onSubmitReply && (
            <div className="mt-3 bg-muted/30 rounded-lg p-3 border border-border">
              <CommentForm
                onSubmit={async (content) => {
                  await onSubmitReply(content, comment._id);
                }}
                parentId={comment._id}
              />
              {onCancelReply && (
                <button
                  onClick={onCancelReply}
                  className="text-xs text-muted-foreground hover:text-foreground mt-1"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Render nested replies */}
      {childComments.length > 0 && (
        <div className="mt-2">
          {childComments.map((child) => (
            <Comment
              key={child._id}
              comment={child as any}
              onReply={onReply}
              storyOwnerId={storyOwnerId}
              currentUserId={currentUserId}
              replyingToId={replyingToId}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
