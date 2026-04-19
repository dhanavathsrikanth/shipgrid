import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUserId } from "./users";

/** Toggle follow for a product */
export const toggle = mutation({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const existing = await ctx.db
      .query("product_follows")
      .withIndex("by_storyId_userId", (q) =>
        q.eq("storyId", args.storyId).eq("userId", userId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { following: false };
    }

    await ctx.db.insert("product_follows", {
      storyId: args.storyId,
      userId,
      followedAt: Date.now(),
    });
    return { following: true };
  },
});

/** Check if current user follows a product */
export const isFollowing = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject),
      )
      .unique();
    if (!user) return false;

    const row = await ctx.db
      .query("product_follows")
      .withIndex("by_storyId_userId", (q) =>
        q.eq("storyId", args.storyId).eq("userId", user._id),
      )
      .unique();
    return row !== null;
  },
});

/** Count followers for a product */
export const getFollowerCount = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("product_follows")
      .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
      .take(1000);
    return rows.length;
  },
});
