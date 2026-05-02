import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const publishBuildLog = mutation({
  args: {
    storyId: v.id("stories"),
    buildingNow: v.string(),
    shippedLast: v.string(),
    notWorking: v.optional(v.string()),
    learnedThis: v.optional(v.string()),
    needHelpWith: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const story = await ctx.db.get(args.storyId);
    if (!story) throw new Error("Story not found");
    if (story.userId !== user._id) throw new Error("Not authorised");

    // Validate lengths
    if (args.buildingNow.length > 200) throw new Error("Building now: max 200 chars");
    if (args.shippedLast.length > 200) throw new Error("Shipped last: max 200 chars");

    const logId = await ctx.db.insert("build_logs", {
      storyId: args.storyId,
      userId: user._id,
      buildingNow: args.buildingNow,
      shippedLast: args.shippedLast,
      notWorking: args.notWorking,
      learnedThis: args.learnedThis,
      needHelpWith: args.needHelpWith,
      publishedAt: Date.now(),
    });

    return logId;
  },
});

export const getLatestBuildLog = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("build_logs")
      .withIndex("by_story_recent", (q) => q.eq("storyId", args.storyId))
      .order("desc")
      .first();
  },
});

export const getAllBuildLogs = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("build_logs")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .order("desc")
      .collect();
  },
});
