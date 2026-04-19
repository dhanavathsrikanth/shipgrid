import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

/**
 * Recalculates trendingScore for all approved, non-hidden stories.
 *
 * Formula (public — documented at /scoring):
 *   trendingScore = (votes + avgRating×10×ratingCount + commentCount×3)
 *                  ÷ (hoursOld + 2)^1.5
 *
 * Scheduled hourly via crons.ts.
 */
export const recalculateAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const HOUR_MS = 1000 * 60 * 60;

    // Fetch approved, non-hidden stories in batches of 200
    // to stay well within Convex mutation limits.
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_status", (q) =>
        q.eq("status", "approved"),
      )
      .filter((q) => q.neq(q.field("isHidden"), true))
      .take(200);

    for (const story of stories) {
      const hoursOld = Math.max(0, (now - story._creationTime) / HOUR_MS);
      const avgRating =
        story.ratingCount > 0 ? story.ratingSum / story.ratingCount : 0;

      const numerator =
        story.votes +
        avgRating * 10 * (story.ratingCount ?? 0) +
        (story.commentCount ?? 0) * 3;

      const denominator = Math.pow(hoursOld + 2, 1.5);
      const trendingScore = numerator / denominator;

      await ctx.db.patch(story._id, {
        trendingScore: parseFloat(trendingScore.toFixed(4)),
      });
    }
  },
});

/**
 * Returns top N trending stories for shelf display.
 * Excludes hidden/archived stories.
 */
export const getTopTrending = query({
  args: {
    limit: v.optional(v.number()),
    tagId: v.optional(v.id("tags")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const stories = await ctx.db
      .query("stories")
      .withIndex("by_status_trendingScore", (q) =>
        q.eq("status", "approved"),
      )
      .order("desc")
      .filter((q) => q.neq(q.field("isHidden"), true))
      .take(100); // fetch more, then filter + sort in memory

    // Sort by trendingScore descending (index orders by trendingScore but
    // we need to also handle undefined values from older documents)
    const sorted = stories
      .sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0));

    // Apply optional tag filter
    const filtered = args.tagId
      ? sorted.filter((s) => (s.tagIds ?? []).includes(args.tagId!))
      : sorted;

    const page = filtered.slice(0, limit);

    // Resolve screenshot URLs + author info
    return await Promise.all(
      page.map(async (story) => {
        const screenshotUrl = story.screenshotId
          ? await ctx.storage.getUrl(story.screenshotId)
          : null;

        const author = story.userId ? await ctx.db.get(story.userId) : null;

        const averageRating =
          story.ratingCount > 0
            ? parseFloat(
                (story.ratingSum / story.ratingCount).toFixed(1),
              )
            : 0;

        // Resolve tags
        const tags = await Promise.all(
          (story.tagIds ?? []).map((id) => ctx.db.get(id)),
        );

        return {
          _id: story._id,
          _creationTime: story._creationTime,
          title: story.title,
          slug: story.slug,
          description: story.description,
          url: story.url,
          votes: story.votes,
          commentCount: story.commentCount,
          trendingScore: story.trendingScore,
          screenshotUrl,
          averageRating,
          stage: story.stage,
          tagIds: story.tagIds,
          tags: tags
            .filter((t): t is NonNullable<typeof t> => t !== null)
            .map((t) => ({
              _id: t._id,
              name: t.name,
              slug: t.slug,
              backgroundColor: t.backgroundColor,
              textColor: t.textColor,
            })),
          authorName: author?.name,
          authorUsername: author?.username,
          authorImageUrl: author?.imageUrl,
        };
      }),
    );
  },
});

/**
 * Returns stories launched in the last 48 hours (Fresh Launches shelf).
 * Stories without a featuredUntil field fall back to _creationTime.
 */
export const getFreshLaunches = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 8;
    const cutoff = Date.now() - 48 * 60 * 60 * 1000; // 48 hours ago

    const stories = await ctx.db
      .query("stories")
      .withIndex("by_status", (q) =>
        q.eq("status", "approved"),
      )
      .filter((q) =>
        q.and(
          q.neq(q.field("isHidden"), true),
          q.gte(q.field("_creationTime"), cutoff),
        ),
      )
      .order("desc")
      .take(50);

    const page = stories
      .slice(0, limit);

    return await Promise.all(
      page.map(async (story) => {
        const screenshotUrl = story.screenshotId
          ? await ctx.storage.getUrl(story.screenshotId)
          : null;
        const author = story.userId ? await ctx.db.get(story.userId) : null;
        const tags = await Promise.all(
          (story.tagIds ?? []).map((id) => ctx.db.get(id)),
        );

        return {
          _id: story._id,
          _creationTime: story._creationTime,
          title: story.title,
          slug: story.slug,
          description: story.description,
          url: story.url,
          votes: story.votes,
          commentCount: story.commentCount,
          screenshotUrl,
          stage: story.stage,
          tags: tags
            .filter((t): t is NonNullable<typeof t> => t !== null)
            .map((t) => ({
              _id: t._id,
              name: t.name,
              slug: t.slug,
              backgroundColor: t.backgroundColor,
              textColor: t.textColor,
            })),
          authorName: author?.name,
          authorUsername: author?.username,
        };
      }),
    );
  },
});

/**
 * Returns stories in beta stage (In Beta shelf).
 */
export const getInBeta = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 8;

    const stories = await ctx.db
      .query("stories")
      .withIndex("by_stage", (q) => q.eq("stage", "beta"))
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "approved"),
          q.neq(q.field("isHidden"), true),
        ),
      )
      .order("desc")
      .take(limit);

    return await Promise.all(
      stories.map(async (story) => {
        const screenshotUrl = story.screenshotId
          ? await ctx.storage.getUrl(story.screenshotId)
          : null;
        const author = story.userId ? await ctx.db.get(story.userId) : null;

        return {
          _id: story._id,
          _creationTime: story._creationTime,
          title: story.title,
          slug: story.slug,
          description: story.description,
          url: story.url,
          votes: story.votes,
          commentCount: story.commentCount,
          stage: story.stage,
          betaOpenedAt: story.betaOpenedAt,
          screenshotUrl,
          authorName: author?.name,
          authorUsername: author?.username,
        };
      }),
    );
  },
});
