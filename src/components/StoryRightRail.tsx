"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Users,
  TrendingUp,
  Sparkles,
  UserPlus,
  UserCheck,
  ArrowUpCircle,
  Mail,
  CheckCircle2,
  FileText,
  Clock,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { StageBadge } from "./StageBadge";

interface StoryRightRailProps {
  storyId: Id<"stories">;
  storyUserId: Id<"users">;
  votes: number;
  waitlistCount?: number;
  waitlistEnabled?: boolean;
  productName: string;
}

export function StoryRightRail({
  storyId,
  storyUserId,
  votes,
  waitlistCount,
  waitlistEnabled,
  productName,
}: StoryRightRailProps) {
  const { isSignedIn } = useUser();

  const founder = useQuery(api.users.getUserById, { userId: storyUserId });
  const founderProducts = useQuery(api.stories.listApprovedByUser, {
    userId: storyUserId,
    excludeStoryId: storyId,
    limit: 3,
  });
  const followers = useQuery(api.follows.getProductFollowers, { storyId });
  const isFollowingUser = useQuery(
    api.follows.isFollowing,
    isSignedIn ? { profileUserId: storyUserId } : "skip",
  );

  const toggleFollowUser = useMutation(api.follows.followUser);
  const unfollowUser = useMutation(api.follows.unfollowUser);

  const getSimilar = useAction(api.icpMatch.getSimilarStories);
  const [similar, setSimilar] = React.useState<any[] | null>(null);

  // Waitlist signup (compact)
  const joinWaitlist = useMutation(api.waitlist.joinWaitlist);
  const [email, setEmail] = React.useState("");
  const [submittingEmail, setSubmittingEmail] = React.useState(false);
  const [joinSuccess, setJoinSuccess] = React.useState(false);
  const [joinError, setJoinError] = React.useState<string | null>(null);

  // Recent changelogs
  const allBuildLogs = useQuery(
    api.buildlog.getAllBuildLogs,
    waitlistEnabled !== undefined ? { storyId } : "skip",
  );
  const recentLogs = (allBuildLogs ?? []).slice(0, 3);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setJoinError("Enter a valid email");
      return;
    }
    setSubmittingEmail(true);
    try {
      await joinWaitlist({ storyId, email: trimmed });
      setJoinSuccess(true);
      setEmail("");
    } catch (err: any) {
      setJoinError(err?.message ?? "Failed to join waitlist");
    } finally {
      setSubmittingEmail(false);
    }
  };

  React.useEffect(() => {
    let active = true;
    getSimilar({ storyId, limit: 3 })
      .then((res) => {
        if (active) setSimilar(res);
      })
      .catch(() => {
        if (active) setSimilar([]);
      });
    return () => {
      active = false;
    };
  }, [getSimilar, storyId]);

  const handleToggleFollow = async () => {
    if (!isSignedIn) return;
    try {
      if (isFollowingUser) {
        await unfollowUser({ userIdToUnfollow: storyUserId });
      } else {
        await toggleFollowUser({ userIdToFollow: storyUserId });
      }
    } catch (e) {
      console.error("Follow toggle failed", e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Founder Mini-Card */}
      {founder && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            Built by
          </div>
          <Link
            href={founder.username ? `/${founder.username}` : `/`}
            className="flex items-center gap-3 group"
          >
            {founder.imageUrl ? (
              <Image
                src={founder.imageUrl}
                alt={founder.name}
                width={40}
                height={40}
                className="rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {founder.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground truncate group-hover:underline">
                {founder.name}
              </div>
              {founder.username && (
                <div className="text-xs text-muted-foreground truncate">
                  @{founder.username}
                </div>
              )}
            </div>
          </Link>
          {isSignedIn && (
            <button
              onClick={handleToggleFollow}
              className={`mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isFollowingUser
                  ? "bg-muted text-foreground hover:bg-muted/80"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {isFollowingUser ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Follow
                </>
              )}
            </button>
          )}

          {/* Other products by this founder */}
          {founderProducts && founderProducts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                More from this founder
              </div>
              <div className="space-y-2">
                {founderProducts.map((p) => (
                  <Link
                    key={p._id}
                    href={`/s/${p.slug}`}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group"
                  >
                    {p.screenshotUrl ? (
                      <Image
                        src={p.screenshotUrl}
                        alt={p.title}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded object-cover flex-shrink-0 border border-border"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded bg-muted flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate group-hover:underline">
                        {p.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.description}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Stats Card */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
          Stats
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatItem
            icon={<ArrowUpCircle className="w-4 h-4" />}
            label="Votes"
            value={votes}
          />
          <StatItem
            icon={<Users className="w-4 h-4" />}
            label="Followers"
            value={followers?.length ?? 0}
          />
          {typeof waitlistCount === "number" && waitlistCount > 0 && (
            <StatItem
              icon={<TrendingUp className="w-4 h-4" />}
              label="Waitlist"
              value={waitlistCount}
            />
          )}
        </div>
      </div>

      {/* Inline Waitlist Signup (compact) */}
      {waitlistEnabled && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            <Mail className="w-3.5 h-3.5" />
            Join Waitlist
          </div>
          {joinSuccess ? (
            <div className="flex items-start gap-2 py-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-foreground">
                You&apos;re on the list! We&apos;ll email you when {productName} is ready.
              </div>
            </div>
          ) : (
            <form onSubmit={handleJoinWaitlist} className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Get notified when {productName} launches.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={submittingEmail}
                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-foreground disabled:opacity-50"
                required
              />
              <button
                type="submit"
                disabled={submittingEmail || !email.trim()}
                className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {submittingEmail ? "Joining..." : "Notify Me"}
              </button>
              {joinError && (
                <p className="text-xs text-destructive">{joinError}</p>
              )}
              {typeof waitlistCount === "number" && waitlistCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Join {waitlistCount.toLocaleString()} others waiting
                </p>
              )}
            </form>
          )}
        </div>
      )}

      {/* Recent Changelogs Preview */}
      {recentLogs.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            Recent Updates
          </div>
          <div className="space-y-3">
            {recentLogs.map((log: any) => (
              <div
                key={log._id}
                className="pb-3 border-b border-border last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(log.publishedAt)}
                </div>
                {log.shippedLast && (
                  <div className="text-sm text-foreground">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Shipped:
                    </span>{" "}
                    {log.shippedLast}
                  </div>
                )}
                {log.buildingNow && (
                  <div className="text-sm text-foreground mt-1">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      Building:
                    </span>{" "}
                    {log.buildingNow}
                  </div>
                )}
              </div>
            ))}
          </div>
          <a
            href="#changelog"
            className="mt-3 inline-block text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            View full changelog →
          </a>
        </div>
      )}

      {/* Similar Products */}
      {similar === null ? (
        <SimilarSkeleton />
      ) : similar.length > 0 ? (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Similar Products
          </div>
          <div className="space-y-2">
            {similar.map((s: any) => (
              <Link
                key={s._id}
                href={`/s/${s.slug}`}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group"
              >
                {s.screenshotUrl ? (
                  <Image
                    src={s.screenshotUrl}
                    alt={s.title}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded object-cover flex-shrink-0 border border-border"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="text-sm font-medium text-foreground truncate group-hover:underline">
                      {s.title}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {s.description}
                  </div>
                </div>
                <StageBadge stage={s.currentStage} betaOpenedAt={s.betaOpenedAt} />
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-lg font-semibold text-foreground mt-0.5">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function SimilarSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border p-4 animate-pulse">
      <div className="h-3 w-32 bg-muted rounded mb-3" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 p-2">
            <div className="w-10 h-10 rounded bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-2.5 w-40 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
