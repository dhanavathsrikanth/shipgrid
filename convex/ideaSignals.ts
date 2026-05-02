import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendIdeaSignal = mutation({
  args: {
    storyId: v.id("stories"),
    signal: v.string(), // "interested" | "would_pay" | "not_for_me"
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const validSignals = ["interested", "would_pay", "not_for_me"];
    if (!validSignals.includes(args.signal)) throw new Error("Invalid signal");

    // Upsert — user can change their signal
    const existing = await ctx.db
      .query("idea_signals")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("storyId"), args.storyId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        signal: args.signal,
        signalledAt: Date.now(),
      });
    } else {
      await ctx.db.insert("idea_signals", {
        storyId: args.storyId,
        userId: user._id,
        signal: args.signal,
        signalledAt: Date.now(),
      });
    }
  },
});

export const getIdeaSignalSummary = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const signals = await ctx.db
      .query("idea_signals")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect();

    const counts = { interested: 0, would_pay: 0, not_for_me: 0 };
    for (const s of signals) {
      counts[s.signal as keyof typeof counts] =
        (counts[s.signal as keyof typeof counts] ?? 0) + 1;
    }

    return { total: signals.length, counts };
  },
});

export const getMySignal = query({
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
      .query("idea_signals")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("storyId"), args.storyId))
      .first();
  },
});
