"use client";

import React from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MentionTextarea } from "./ui/MentionTextarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CommentFormProps {
  onSubmit: (content: string) => void;
  parentId?: Id<"comments">;
}

const PROMPT_CHIPS = [
  "What problem does this solve for you?",
  "What feature is missing?",
  "How does this compare to alternatives?",
];

export function CommentForm({ onSubmit, parentId }: CommentFormProps) {
  const [content, setContent] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [showChips, setShowChips] = React.useState(true);
  const { isSignedIn, isLoaded: isClerkLoaded } = useUser();
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isClerkLoaded) return;

    if (!isSignedIn) {
      toast.error("Please sign in to comment.");
      router.push("/sign-in");
      return;
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length < 10) {
      setError("Comment must be at least 10 characters long.");
      return;
    }
    setError(null);
    onSubmit(trimmedContent);
    setContent("");
    setShowChips(true);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    if (value.trim().length > 0) setShowChips(false);
    if (!value.trim()) setShowChips(true);
    if (error && value.trim().length >= 10) setError(null);
  };

  const handleChipClick = (prompt: string) => {
    setContent(prompt + " ");
    setShowChips(false);
  };

  const canSubmit = isClerkLoaded && isSignedIn;
  const isContentValid = content.trim().length >= 10;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {/* Structured feedback prompt chips */}
        {canSubmit && showChips && !parentId && (
          <div className="flex flex-wrap gap-2">
            {PROMPT_CHIPS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleChipClick(prompt)}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <MentionTextarea
          value={content}
          onChange={handleContentChange}
          placeholder={
            canSubmit
              ? "Write your comment… (Markdown supported, min. 10 characters, @mention users)"
              : "Sign in to write your comment…"
          }
          className={`min-h-[100px] ${error ? "border-destructive ring-destructive" : ""}`}
          rows={4}
          required
          disabled={!canSubmit}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && wordCount > 0 && wordCount < 4 && (
          <p className="text-sm text-amber-600">
            Comments under 4 words might be collapsed. Feel free to elaborate!
          </p>
        )}

        <div className="flex items-center justify-between">
          {/* Character count hint */}
          {content.trim().length > 0 && content.trim().length < 10 && (
            <Badge variant="secondary" className="text-xs text-amber-600">
              {10 - content.trim().length} more chars needed
            </Badge>
          )}
          <div className="ml-auto">
            <Button
              type="submit"
              size="sm"
              disabled={!canSubmit || !content.trim() || !isContentValid}
              title={
                !canSubmit
                  ? "Sign in to comment"
                  : !isContentValid && content.trim()
                    ? "Comment must be at least 10 characters."
                    : undefined
              }
            >
              {parentId ? "Reply" : "Comment"}
            </Button>
          </div>
        </div>
      </form>

      {!isClerkLoaded && (
        <p className="mt-2 text-sm text-muted-foreground">Loading user status…</p>
      )}

      {isClerkLoaded && !isSignedIn && (
        <div className="mt-4 p-3 bg-muted border border-border rounded-md text-sm">
          <p className="text-foreground">
            Please{" "}
            <button
              onClick={() => router.push("/sign-in")}
              className="text-foreground hover:underline font-semibold focus:outline-none"
            >
              sign in
            </button>{" "}
            or{" "}
            <button
              onClick={() => router.push("/sign-in")}
              className="text-foreground hover:underline font-semibold focus:outline-none"
            >
              sign up
            </button>{" "}
            to leave a comment.
          </p>
        </div>
      )}
    </>
  );
}
