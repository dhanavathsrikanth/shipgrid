import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const getProductFollowers = internalQuery({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("product_follows")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect();
    return follows.map(f => f.userId);
  }
});

export const hasSentNotification = internalQuery({
  args: { storyId: v.id("stories"), type: v.string() },
  handler: async (ctx, args) => {
    const log = await ctx.db
      .query("notificationLog")
      .withIndex("by_story_type", (q) => 
        q.eq("storyId", args.storyId).eq("type", args.type)
      )
      .first();
    return log !== null;
  }
});

export const logNotification = internalMutation({
  args: { storyId: v.id("stories"), type: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("notificationLog", {
      storyId: args.storyId,
      type: args.type,
      sentAt: Date.now()
    });
  }
});
