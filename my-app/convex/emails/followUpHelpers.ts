// V8 runtime — internalQuery + internalMutation helpers for the 30-day follow-up cron.
// Called from the Node action in followUp.ts via ctx.runQuery / ctx.runMutation.

import { internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Window: stories approved between 29.5 and 30.5 days ago
const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_LOWER = 29.5 * DAY_MS;
const WINDOW_UPPER = 30.5 * DAY_MS;

/**
 * Returns approved stories whose approvedAt (or _creationTime) falls in the
 * 30-day window.  Returns at most 100 per run to stay inside Convex limits.
 */
export const getStoriesDue30DayFollowUp = internalQuery({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const now = Date.now();
    const from = now - WINDOW_UPPER; // older bound
    const to = now - WINDOW_LOWER;  // newer bound

    // Collect approved stories created in the 30-day window.
    // We use _creationTime as a proxy for approvedAt (close enough for a daily cron).
    const candidates = await ctx.db
      .query("stories")
      .withIndex("by_status_trendingScore", (q) => q.eq("status", "approved"))
      .filter((q) =>
        q.and(
          q.gte(q.field("_creationTime"), from),
          q.lte(q.field("_creationTime"), to),
        ),
      )
      .take(100);

    // Filter out stories whose authors have no userId (anonymous)
    return candidates.filter((s: any) => s.userId);
  },
});

/**
 * Check if we have already sent a 30-day follow-up for this specific story.
 * We store a record in `followUpEmailLog` (created below via markFollowUpSent).
 */
export const hasReceivedFollowUp = internalQuery({
  args: { storyId: v.id("stories") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("followUpEmailLog")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .first();
    return !!existing;
  },
});

/**
 * Record that we sent the 30-day follow-up for this story.
 * Called after a successful send inside the Node action.
 */
export const markFollowUpSent = internalMutation({
  args: {
    storyId: v.id("stories"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("followUpEmailLog", {
      storyId: args.storyId,
      userId: args.userId,
      sentAt: Date.now(),
    });
    return null;
  },
});
