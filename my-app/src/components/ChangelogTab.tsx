"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  Plus,
  Bell,
  BellOff,
  Zap,
  Wrench,
  TrendingUp,
  Megaphone,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChangelogTabProps {
  storyId: Id<"stories">;
  isOwner: boolean;
}

const TYPE_CONFIG = {
  feature:      { icon: Zap,        label: "New Feature",   className: "bg-primary/10 text-primary" },
  improvement:  { icon: TrendingUp, label: "Improvement",   className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  fix:          { icon: Wrench,     label: "Bug Fix",       className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  announcement: { icon: Megaphone,  label: "Announcement",  className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
} as const;

export function ChangelogTab({ storyId, isOwner }: ChangelogTabProps) {
  const { isSignedIn } = useAuth();
  const entries = useQuery(api.changelog.listByStory, { storyId });
  const postUpdate = useMutation(api.changelog.postUpdate);
  const deleteUpdate = useMutation(api.changelog.deleteUpdate);
  const isFollowing = useQuery(
    api.productFollows.isFollowing,
    isSignedIn ? { storyId } : "skip",
  );
  const followerCount = useQuery(api.productFollows.getFollowerCount, { storyId });
  const toggleFollow = useMutation(api.productFollows.toggle);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"feature" | "fix" | "improvement" | "announcement">("feature");
  const [loading, setLoading] = useState(false);

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      await postUpdate({ storyId, title, content, type });
      toast.success("Update posted!");
      setTitle(""); setContent(""); setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to post update.");
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: Id<"changelogs">) => {
    if (!confirm("Delete this update?")) return;
    try {
      await deleteUpdate({ changelogId: id });
      toast.success("Update deleted.");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleFollow = async () => {
    if (!isSignedIn) { toast.error("Sign in to follow updates."); return; }
    try {
      const result = await toggleFollow({ storyId });
      toast.success(result.following ? "Following for updates!" : "Unfollowed.");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (entries === undefined) {
    return (
      <div className="space-y-3 pt-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {followerCount !== undefined && followerCount > 0 && (
            <span>{followerCount} follower{followerCount !== 1 ? "s" : ""}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Follow button for non-owners */}
          {!isOwner && (
            <Button
              size="sm"
              variant={isFollowing ? "secondary" : "outline"}
              onClick={handleFollow}
              className="gap-1.5 rounded-full text-xs h-7 px-3"
            >
              {isFollowing ? (
                <><BellOff className="w-3 h-3" /> Unfollow</>
              ) : (
                <><Bell className="w-3 h-3" /> Follow</>
              )}
            </Button>
          )}
          {/* Post update button for owners */}
          {isOwner && (
            <Button
              size="sm"
              onClick={() => setShowForm((v) => !v)}
              className="gap-1.5 rounded-full text-xs h-7 px-3"
            >
              <Plus className="w-3 h-3" />
              Post Update
            </Button>
          )}
        </div>
      </div>

      {/* Post update form */}
      {showForm && isOwner && (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handlePostUpdate} className="space-y-3">
              <Select
                value={type}
                onValueChange={(val) => setType(val as any)}
              >
                <SelectTrigger className="w-full text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">⚡ New Feature</SelectItem>
                  <SelectItem value="improvement">📈 Improvement</SelectItem>
                  <SelectItem value="fix">🔧 Bug Fix</SelectItem>
                  <SelectItem value="announcement">📣 Announcement</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Update title"
                required
                className="text-sm"
              />
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What changed? What's new?"
                rows={3}
                required
                className="text-sm resize-none"
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Publish"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Changelog entries */}
      {entries.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          {isOwner
            ? "No updates yet. Post your first update to keep followers informed!"
            : "No updates yet — follow to be notified when the maker ships something new."}
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const cfg = TYPE_CONFIG[entry.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.feature;
            const TypeIcon = cfg.icon;
            return (
              <Card key={entry._id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="secondary"
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 ${cfg.className}`}
                      >
                        <TypeIcon className="w-3 h-3" />
                        {cfg.label}
                      </Badge>
                      <h3 className="text-sm font-semibold text-foreground">{entry.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(entry.publishedAt)} ago
                      </span>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 text-muted-foreground hover:text-destructive"
                          title="Delete update"
                          onClick={() => handleDelete(entry._id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {entry.content}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
