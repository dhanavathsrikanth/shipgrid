import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Owner-only analytics query.
 * Returns engagement, ICP match rate, comment quality, interested count, etc.
 */
export const getStoryAnalytics = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject),
      )
      .unique();
    if (!user) throw new Error("User not found");

    const story = await ctx.db.get(args.storyId);
    if (!story) throw new Error("Story not found");
    if (story.userId !== user._id) throw new Error("Not authorized");

    // ---- Views ----
    const views = await ctx.db
      .query("productViews")
      .withIndex("by_story_viewed", (q) => q.eq("storyId", args.storyId))
      .order("desc")
      .take(1000);

    const totalViews = views.length;
    const uniqueViewerIds = new Set(
      views.filter((v) => v.viewerId).map((v) => v.viewerId!),
    );
    const uniqueViews = uniqueViewerIds.size;
    const icpViews = views.filter((v) => v.isIcpMatch).length;
    const icpMatchRate =
      totalViews > 0 ? Math.round((icpViews / totalViews) * 100) : 0;

    // Views by day (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentViews = views.filter((v) => v.viewedAt >= thirtyDaysAgo);
    const viewsByDay: Record<string, number> = {};
    for (const view of recentViews) {
      const day = new Date(view.viewedAt).toISOString().split("T")[0];
      viewsByDay[day] = (viewsByDay[day] ?? 0) + 1;
    }

    // ---- Votes ----
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .take(1000);

    const votesByDay: Record<string, number> = {};
    for (const vote of votes) {
      if (vote._creationTime >= thirtyDaysAgo) {
        const day = new Date(vote._creationTime).toISOString().split("T")[0];
        votesByDay[day] = (votesByDay[day] ?? 0) + 1;
      }
    }

    // ---- Ratings ----
    const ratings = await ctx.db
      .query("storyRatings")
      .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
      .take(1000);

    const avgRating =
      ratings.length > 0
        ? parseFloat(
            (
              ratings.reduce((s, r) => s + r.value, 0) / ratings.length
            ).toFixed(1),
          )
        : 0;

    // ---- Comments quality ----
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_storyId_status", (q) =>
        q.eq("storyId", args.storyId).eq("status", "approved"),
      )
      .take(500);

    const commentQuality = {
      high: comments.filter((c) => (c.qualityScore ?? 0) >= 60).length,
      medium: comments.filter(
        (c) => (c.qualityScore ?? 0) >= 30 && (c.qualityScore ?? 0) < 60,
      ).length,
      low: comments.filter((c) => (c.qualityScore ?? 0) < 30).length,
      makerResponses: comments.filter((c) => c.isMakerResponse).length,
    };

    // ---- Bookmarks ----
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
      .take(1000);
    const bookmarkCount = bookmarks.length;

    // ---- Interested ----
    const interests = await ctx.db
      .query("productInterests")
      .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
      .take(1000);
    const interestedCount = interests.length;

    // ---- Followers ----
    const followers = await ctx.db
      .query("product_follows")
      .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
      .take(1000);
    const followerCount = followers.length;

    // ---- Feature Requests ----
    const featureRequestCount = (
      await ctx.db
        .query("featureRequests")
        .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
        .take(500)
    ).length;

    // ---- ICP Audience breakdown ----
    const roleCounts: Record<string, number> = {};
    const problemCounts: Record<string, number> = {};
    for (const view of views.filter((v) => v.isIcpMatch)) {
      if (view.viewerRole) {
        roleCounts[view.viewerRole] = (roleCounts[view.viewerRole] ?? 0) + 1;
      }
      if (view.viewerProblem) {
        problemCounts[view.viewerProblem] =
          (problemCounts[view.viewerProblem] ?? 0) + 1;
      }
    }

    return {
      totalViews,
      uniqueViews,
      icpMatchRate,
      viewsByDay,
      votesByDay,
      totalVotes: story.votes,
      avgRating,
      ratingCount: ratings.length,
      commentQuality,
      totalComments: story.commentCount ?? 0,
      bookmarkCount,
      interestedCount,
      followerCount,
      featureRequestCount,
      trendingScore: story.trendingScore,
      roleCounts,
      problemCounts,
    };
  },
});
