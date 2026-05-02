import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { getAuthenticatedUserId, requireAdminRole } from "./users";

/**
 * Track a builder metric event (impression, click, conversion).
 * This uses an atomic upsert to avoid duplicate records for the same day.
 */
export const trackEvent = mutation({
  args: {
    storyId: v.id("stories"),
    type: v.union(v.literal("impression"), v.literal("click"), v.literal("conversion")),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    
    // Check if we already have a metric record for this story today
    const existing = await ctx.db
      .query("storyMetrics")
      .withIndex("by_story_date", (q) => 
        q.eq("storyId", args.storyId).eq("date", today)
      )
      .unique();

    if (existing) {
      const update: any = {};
      const field = `${args.type}s` as keyof Doc<"storyMetrics">;
      update[field] = (existing[field] as number || 0) + 1;
      await ctx.db.patch(existing._id, update);
    } else {
      await ctx.db.insert("storyMetrics", {
        storyId: args.storyId,
        date: today,
        impressions: args.type === "impression" ? 1 : 0,
        clicks: args.type === "click" ? 1 : 0,
        conversions: args.type === "conversion" ? 1 : 0,
      });
    }
  },
});

/**
 * Get analytics for a specific story.
 * Restricted to the owner of the story or an admin.
 */
export const getStoryStats = query({
  args: {
    storyId: v.id("stories"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const story = await ctx.db.get(args.storyId);
    
    if (!story) throw new Error("Story not found");
    
    // Authorization check: Only owner or admin
    if (story.userId !== userId) {
      // Check if user is admin (this helper throws if not admin)
      try {
        await requireAdminRole(ctx);
      } catch (e) {
        throw new Error("Unauthorized: Only the owner can view analytics.");
      }
    }

    const numDays = args.days ?? 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - numDays);
    const cutoffStr = cutoffDate.toISOString().split("T")[0];

    const metrics = await ctx.db
      .query("storyMetrics")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .filter((q) => q.gte(q.field("date"), cutoffStr))
      .collect();

    // Sort by date ascending for charts
    return metrics.sort((a, b) => a.date.localeCompare(b.date));
  },
});

/**
 * Get total lifetime metrics for a story.
 */
export const getStorySummary = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const metrics = await ctx.db
      .query("storyMetrics")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect();

    return metrics.reduce(
      (acc, m) => ({
        impressions: acc.impressions + m.impressions,
        clicks: acc.clicks + m.clicks,
        conversions: acc.conversions + m.conversions,
      }),
      { impressions: 0, clicks: 0, conversions: 0 }
    );
  },
});
