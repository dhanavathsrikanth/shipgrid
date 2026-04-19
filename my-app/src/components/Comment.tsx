"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ChevronUp, ChevronDown, Trash2, MessageSquare, Award, Zap } from "lucide-react";
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

interface CommentProps {
  comment: CommentType & {
    isMakerResponse?: boolean;
    qualityScore?: number;
    flaggedAsLowQuality?: boolean;
    authorIsVerified?: boolean;
  };
  onReply: (parentId: Id<"comments">) => void;
  hasVoted?: boolean;
  isOwn?: boolean;
  depth?: number;
}

export function Comment({
  comment,
  onReply,
  hasVoted = false,
  isOwn = false,
  depth = 0,
}: CommentProps) {
  const { isSignedIn } = useAuth();
  const voteCommentMut = useMutation(api.comments.voteComment);
  const deleteOwnCommentMut = useMutation(api.comments.deleteOwnComment);

  const [voted, setVoted] = React.useState(hasVoted);
  const [votes, setVotes] = React.useState(comment.votes ?? 0);
  const [collapsed, setCollapsed] = React.useState(
    comment.flaggedAsLowQuality === true && !comment.isMakerResponse && !isOwn,
  );
  const [deleting, setDeleting] = React.useState(false);

  // Sync hasVoted prop changes (from parent query refresh)
  React.useEffect(() => {
    setVoted(hasVoted);
  }, [hasVoted]);

  const authorDisplayName = comment.authorName || "Anonymous";
  const authorProfileUrl = comment.authorUsername
    ? `/${comment.authorUsername}`
    : null;
  const isMaker = comment.isMakerResponse === true;
  const isVerifiedMaker = isMaker && (comment as any).authorIsVerified === true;

  const qualityScore = comment.qualityScore ?? 0;
  const isHighQuality = qualityScore >= 60;
  const isMediumQuality = qualityScore >= 30 && qualityScore < 60;

  const handleVote = async () => {
    if (!isSignedIn) {
      toast.error("Sign in to upvote comments.");
      return;
    }
    // Optimistic update
    const nextVoted = !voted;
    setVoted(nextVoted);
    setVotes((v) => (nextVoted ? v + 1 : Math.max(0, v - 1)));
    try {
      await voteCommentMut({ commentId: comment._id });
    } catch (e: any) {
      // Rollback
      setVoted(!nextVoted);
      setVotes((v) => (!nextVoted ? v + 1 : Math.max(0, v - 1)));
      toast.error(e.message || "Failed to vote.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete your comment?")) return;
    setDeleting(true);
    try {
      await deleteOwnCommentMut({ commentId: comment._id });
      toast.success("Comment deleted.");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete comment.");
      setDeleting(false);
    }
  };

  // Collapsed state for low-quality comments
  if (collapsed) {
    return (
      <div className={`mt-3 ${depth > 0 ? "ml-6 pl-3 border-l border-border/50" : "pl-2"}`}>
        <button
          onClick={() => setCollapsed(false)}
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground flex items-center gap-1 transition-colors italic"
        >
          <ChevronDown className="w-3 h-3" />
          Short reply from {authorDisplayName} — click to expand
        </button>
      </div>
    );
  }

  return (
    <div
      className={`mt-4 group ${
        depth > 0 ? "ml-6 pl-4 border-l-2 border-border/40" : ""
      } ${isMaker ? "relative" : ""}`}
    >
      {/* Maker highlight bar */}
      {isMaker && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-violet-400 rounded-full" />
      )}

      {/* Author row */}
      <div className="flex gap-2 items-center text-sm text-muted-foreground mb-2 flex-wrap">
        {/* Avatar placeholder */}
        <div className="w-6 h-6 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-muted-foreground/60 uppercase">
          {authorDisplayName[0] ?? "?"}
        </div>

        {authorProfileUrl && comment.authorUsername ? (
          <ProfileHoverCard username={comment.authorUsername}>
            <Link
              href={authorProfileUrl}
              className="font-semibold text-foreground hover:underline text-sm"
            >
              {authorDisplayName}
            </Link>
          </ProfileHoverCard>
        ) : (
          <span className="font-semibold text-foreground text-sm">
            {authorDisplayName}
          </span>
        )}

        {/* Badges */}
        {isVerifiedMaker ? (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Award className="w-2.5 h-2.5" /> Verified Maker
          </span>
        ) : isMaker ? (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-400">
            <Zap className="w-2.5 h-2.5" /> Maker
          </span>
        ) : null}

        {/* Quality badge — only for high-quality non-maker comments */}
        {isHighQuality && !isMaker && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200/50 dark:bg-emerald-900/20 dark:text-emerald-400">
            ✦ Quality
          </span>
        )}

        <span className="text-muted-foreground/50">·</span>
        <span className="text-xs text-muted-foreground/60">
          {formatDistanceToNow(comment._creationTime)} ago
        </span>
      </div>

      {/* Comment content */}
      <div className="prose prose-sm max-w-none text-foreground/85 leading-relaxed pl-8">
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p className="mb-0">{renderTextWithMentions(String(children))}</p>
            ),
          }}
        >
          {comment.content}
        </ReactMarkdown>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-3 mt-2 pl-8 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Upvote button */}
        <button
          onClick={handleVote}
          className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-all ${
            voted
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          title={voted ? "Remove upvote" : "Upvote this comment"}
        >
          <ChevronUp className="w-3.5 h-3.5" />
          <span>{votes}</span>
        </button>

        {/* Reply button */}
        <button
          onClick={() => onReply(comment._id)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare className="w-3 h-3" />
          Reply
        </button>

        {/* Collapse button — for low-quality */}
        {comment.flaggedAsLowQuality && (
          <button
            onClick={() => setCollapsed(true)}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            collapse
          </button>
        )}

        {/* Delete own comment */}
        {isOwn && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-destructive transition-colors ml-auto"
            title="Delete your comment"
          >
            <Trash2 className="w-3 h-3" />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
    </div>
  );
}
