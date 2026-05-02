"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ChevronUp, MessageSquare, ChevronDown } from "lucide-react";
import type { Comment as CommentType } from "../types";
import ReactMarkdown from "react-markdown";
import { Id } from "../../convex/_generated/dataModel";
import Link from "next/link";
import { renderTextWithMentions } from "../utils/mentions";
import { ProfileHoverCard } from "./ui/ProfileHoverCard";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";

interface CommentProps {
  comment: CommentType & {
    isMakerResponse?: boolean;
    qualityScore?: number;
    flaggedAsLowQuality?: boolean;
    authorIsVerified?: boolean;
    votes: number;
  };
  onReply: (parentId: Id<"comments">) => void;
  storyOwnerId?: Id<"users"> | null;
}

export function Comment({ comment, onReply, storyOwnerId }: CommentProps) {
  const { isSignedIn } = useAuth();
  const [collapsed, setCollapsed] = React.useState(
    comment.flaggedAsLowQuality === true
  );

  const authorDisplayName = comment.authorName || "Anonymous";
  const authorProfileUrl = comment.authorUsername
    ? `/${comment.authorUsername}`
    : null;

  const isMaker = comment.isMakerResponse === true;
  const isVerifiedMaker = isMaker && (comment as any).authorIsVerified === true;

  // Low-quality collapsed view
  if (collapsed) {
    return (
      <div className="pl-4 mt-3">
        <button
          onClick={() => setCollapsed(false)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <ChevronDown className="w-3 h-3" />
          <span className="italic">Short comment from {authorDisplayName}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="pl-4 mt-4">
      {/* Author row */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 flex-wrap">
        {authorProfileUrl && comment.authorUsername ? (
          <ProfileHoverCard username={comment.authorUsername}>
            <Link
              href={authorProfileUrl}
              className="font-medium text-foreground hover:underline"
            >
              {authorDisplayName}
            </Link>
          </ProfileHoverCard>
        ) : (
          <span className="font-medium text-foreground">
            {authorDisplayName}
          </span>
        )}

        {/* Maker / Verified Maker badge */}
        {isVerifiedMaker ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">
            ✓ Verified Maker
          </span>
        ) : isMaker ? (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-400">
            Maker
          </span>
        ) : null}

        <span>•</span>
        <span suppressHydrationWarning>{formatDistanceToNow(comment._creationTime)} ago</span>
      </div>

      {/* Comment content */}
      <div className="prose prose-sm max-w-none text-foreground/80">
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p>{renderTextWithMentions(String(children))}</p>
            ),
            text: ({ children }) => (
              <>{renderTextWithMentions(String(children))}</>
            ),
          }}
        >
          {comment.content}
        </ReactMarkdown>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-4 mt-2">
        {/* Upvote */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ChevronUp className="w-3.5 h-3.5" />
          <span>{comment.votes ?? 0}</span>
        </div>

        <button
          onClick={() => onReply(comment._id)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          reply
        </button>

        {comment.flaggedAsLowQuality && (
          <button
            onClick={() => setCollapsed(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            collapse
          </button>
        )}
      </div>
    </div>
  );
}
