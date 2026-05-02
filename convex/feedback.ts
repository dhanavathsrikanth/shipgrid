import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submitBetaFeedback = mutation({
  args: {
    storyId: v.id("stories"),
    problemSolved: v.string(),
    doesntDo: v.string(),
    notForWho: v.string(),
    verdict: v.string(), // "using" | "dropped" | "never_tried"
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Validate verdict
    const validVerdicts = ["using", "dropped", "never_tried"];
    if (!validVerdicts.includes(args.verdict)) throw new Error("Invalid verdict");

    // Idempotent — one feedback per user per product
    const existing = await ctx.db
      .query("beta_feedback")
      .withIndex("by_user_story", (q) =>
        q.eq("userId", user._id).eq("storyId", args.storyId)
      )
      .first();

    if (existing) {
      // Update existing feedback
      await ctx.db.patch(existing._id, {
        problemSolved: args.problemSolved,
        doesntDo: args.doesntDo,
        notForWho: args.notForWho,
        verdict: args.verdict,
        submittedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("beta_feedback", {
      storyId: args.storyId,
      userId: user._id,
      problemSolved: args.problemSolved,
      doesntDo: args.doesntDo,
      notForWho: args.notForWho,
      verdict: args.verdict,
      submittedAt: Date.now(),
    });
  },
});

export const getBetaFeedbackSummary = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const feedbacks = await ctx.db
      .query("beta_feedback")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect();

    const verdictCounts = { using: 0, dropped: 0, never_tried: 0 };
    for (const f of feedbacks) {
      verdictCounts[f.verdict as keyof typeof verdictCounts] =
        (verdictCounts[f.verdict as keyof typeof verdictCounts] ?? 0) + 1;
    }

    return {
      total: feedbacks.length,
      verdictCounts,
      usingPct:
        feedbacks.length > 0
          ? Math.round((verdictCounts.using / feedbacks.length) * 100)
          : 0,
    };
  },
});

export const getMyBetaFeedback = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return null;
    return await ctx.db
      .query("beta_feedback")
      .withIndex("by_user_story", (q) =>
        q.eq("userId", user._id).eq("storyId", args.storyId)
      )
      .first();
  },
});
