import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUserId } from "./users";

/** Count of interested users for a story */
export const getCount = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("productInterests")
      .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
      .take(1000);
    return rows.length;
  },
});

/** Check if the current user is interested */
export const isInterested = query({
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

    const existing = await ctx.db
      .query("productInterests")
      .withIndex("by_storyId_userId", (q) =>
        q.eq("storyId", args.storyId).eq("userId", user._id),
      )
      .unique();
    return existing !== null;
  },
});

/** Toggle interest — no duplicate, returns new state */
export const toggle = mutation({
  args: {
    storyId: v.id("stories"),
    useCase: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const existing = await ctx.db
      .query("productInterests")
      .withIndex("by_storyId_userId", (q) =>
        q.eq("storyId", args.storyId).eq("userId", userId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { interested: false };
    }

    await ctx.db.insert("productInterests", {
      storyId: args.storyId,
      userId,
      interestedAt: Date.now(),
      useCase: args.useCase?.trim() || undefined,
    });
    return { interested: true };
  },
});

/** Owner-only: list interested users with their use cases */
export const listForOwner = query({
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
    if (!story || story.userId !== user._id) {
      throw new Error("Not authorized");
    }

    const interests = await ctx.db
      .query("productInterests")
      .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
      .order("desc")
      .take(200);

    return await Promise.all(
      interests.map(async (i) => {
        const viewer = await ctx.db.get(i.userId);
        return {
          _id: i._id,
          interestedAt: i.interestedAt,
          useCase: i.useCase,
          userName: viewer?.name,
          userUsername: viewer?.username,
        };
      }),
    );
  },
});
