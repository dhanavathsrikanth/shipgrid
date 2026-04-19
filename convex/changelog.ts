import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUserId } from "./users";

/** List all public updates for a story (newest first) */
export const listByStory = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("changelogs")
      .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
      .order("desc")
      .collect();
  },
});

/** Post a new changelog entry — only story owner allowed */
export const postUpdate = mutation({
  args: {
    storyId: v.id("stories"),
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("feature"),
      v.literal("fix"),
      v.literal("improvement"),
      v.literal("announcement")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const story = await ctx.db.get(args.storyId);
    if (!story) throw new Error("Story not found");
    if (story.userId !== userId) {
      throw new Error("Only the product owner can post updates.");
    }

    await ctx.db.insert("changelogs", {
      storyId: args.storyId,
      title: args.title.trim(),
      content: args.content.trim(),
      type: args.type,
      publishedAt: Date.now(),
    });
  },
});

/** Delete a changelog entry — only story owner allowed */
export const deleteUpdate = mutation({
  args: { changelogId: v.id("changelogs") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const entry = await ctx.db.get(args.changelogId);
    if (!entry) throw new Error("Changelog entry not found");

    const story = await ctx.db.get(entry.storyId);
    if (!story || story.userId !== userId) {
      throw new Error("Not authorized to delete this update.");
    }

    await ctx.db.delete(args.changelogId);
  },
});
