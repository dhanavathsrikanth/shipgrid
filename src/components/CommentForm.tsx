"use client";

import React from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MentionTextarea } from "./ui/MentionTextarea";

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
  const [chipsVisible, setChipsVisible] = React.useState(true);
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
    setChipsVisible(true);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    // Hide chips once user starts typing their own content
    if (value.trim().length > 0) setChipsVisible(false);
    if (!value.trim()) setChipsVisible(true);
    if (error && value.trim().length >= 10) setError(null);
  };

  const handleChipClick = (prompt: string) => {
    setContent(prompt + " ");
    setChipsVisible(false);
  };

  const handleSignIn = () => {
    router.push("/sign-in");
  };

  const canSubmit = isClerkLoaded && isSignedIn;
  const isContentValid = content.trim().length >= 10;

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-4">
        {/* Prompt chips — shown when textarea is empty */}
        {canSubmit && chipsVisible && !parentId && (
          <div className="flex flex-wrap gap-2 mb-3">
            {PROMPT_CHIPS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleChipClick(prompt)}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
              ? "Write your comment... (Markdown supported, min. 10 characters, use @username to mention users)"
              : "Sign in to write your comment..."
          }
          className={`min-h-[100px] ${error ? "border-destructive ring-destructive" : ""}`}
          rows={4}
          required
          disabled={!canSubmit}
        />
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit || !content.trim() || !isContentValid}
          className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            !canSubmit
              ? "Sign in to comment"
              : !isContentValid && content.trim()
                ? "Comment must be at least 10 characters."
                : undefined
          }
        >
          {parentId ? "Reply" : "Comment"}
        </button>
      </form>

      {!isClerkLoaded && (
        <p className="mt-2 text-sm text-muted-foreground">Loading user status...</p>
      )}

      {isClerkLoaded && !isSignedIn && (
        <div className="mt-4 p-3 bg-muted border border-border rounded-md text-sm">
          <p className="text-foreground">
            Please{" "}
            <button
              onClick={handleSignIn}
              className="text-foreground hover:underline font-semibold focus:outline-none"
            >
              sign in
            </button>{" "}
            or{" "}
            <button
              onClick={handleSignIn}
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
