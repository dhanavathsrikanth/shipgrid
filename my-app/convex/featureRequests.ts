import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUserId } from "./users";

/** List feature requests for a story, sorted by votes descending */
export const listByStory = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("featureRequests")
      .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
      .order("desc")
      .take(100);

    // Sort by votes descending in memory (index sorts by storyId + votes but order is fixed)
    requests.sort((a, b) => b.votes - a.votes);

    const identity = await ctx.auth.getUserIdentity();
    let currentUserId: string | null = null;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) =>
          q.eq("clerkId", identity.subject),
        )
        .unique();
      currentUserId = user?._id ?? null;
    }

    return await Promise.all(
      requests.map(async (req) => {
        const author = await ctx.db.get(req.userId);
        let hasVoted = false;
        if (currentUserId) {
          const vote = await ctx.db
            .query("featureRequestVotes")
            .withIndex("by_request_user", (q) =>
              q.eq("requestId", req._id).eq("userId", currentUserId as any),
            )
            .unique();
          hasVoted = vote !== null;
        }
        return {
          ...req,
          authorName: author?.name,
          authorUsername: author?.username,
          hasVoted,
        };
      }),
    );
  },
});

/** Submit a new feature request */
export const submit = mutation({
  args: {
    storyId: v.id("stories"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!args.title.trim()) throw new Error("Title cannot be empty.");

    // Prevent duplicate titles per story
    const existing = await ctx.db
      .query("featureRequests")
      .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
      .filter((q) => q.eq(q.field("title"), args.title.trim()))
      .first();
    if (existing) throw new Error("A request with this title already exists.");

    await ctx.db.insert("featureRequests", {
      storyId: args.storyId,
      userId,
      title: args.title.trim(),
      description: args.description?.trim() || undefined,
      votes: 1, // author auto-votes
      status: "open",
    });
  },
});

/** Upvote / un-upvote a feature request */
export const voteRequest = mutation({
  args: { requestId: v.id("featureRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found.");

    const existing = await ctx.db
      .query("featureRequestVotes")
      .withIndex("by_request_user", (q) =>
        q.eq("requestId", args.requestId).eq("userId", userId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.requestId, {
        votes: Math.max(0, request.votes - 1),
      });
      return { voted: false };
    }

    await ctx.db.insert("featureRequestVotes", {
      requestId: args.requestId,
      userId,
    });
    await ctx.db.patch(args.requestId, { votes: request.votes + 1 });
    return { voted: true };
  },
});

/** Update request status — only the story owner can do this */
export const updateStatus = mutation({
  args: {
    requestId: v.id("featureRequests"),
    status: v.union(
      v.literal("open"),
      v.literal("planned"),
      v.literal("shipped"),
      v.literal("declined"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found.");

    const story = await ctx.db.get(request.storyId);
    if (!story || story.userId !== userId) {
      throw new Error("Only the product owner can update request status.");
    }

    await ctx.db.patch(args.requestId, { status: args.status });
  },
});
