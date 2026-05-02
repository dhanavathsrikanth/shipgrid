import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { requireAdminRole } from "../users";

/**
 * Force logout all users by revoking their Clerk sessions
 * This requires Clerk Admin API access
 */
export const forceLogoutAllUsers = mutation({
  args: {
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    usersProcessed: v.number(),
  }),
  handler: async (ctx, args) => {
    // Only allow admins to force logout users
    await requireAdminRole(ctx);

    // Get all users from database
    const users = await ctx.db.query("users").collect();

    // Schedule the actual logout action (which needs Node.js runtime for Clerk API)
    await ctx.scheduler.runAfter(
      0,
      internal.admin.forceLogout.revokeAllSessions,
      {
        userClerkIds: users.map((u) => u.clerkId),
        reason: args.reason || "Admin forced re-authentication for email sync",
      },
    );

    return {
      success: true,
      message: `Scheduled logout for ${users.length} users. This may take a few minutes to complete.`,
      usersProcessed: users.length,
    };
  },
});

/**
 * --- User Management (Full Power) ---
 */

/**
 * Toggles the 'isBanned' status of a user.
 */
export const adminBanUser = mutation({
  args: { userId: v.id("users"), isBanned: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdminRole(ctx);
    await ctx.db.patch(args.userId, { isBanned: args.isBanned });
    console.log(`[Admin] user ${args.userId} was ${args.isBanned ? "BANNED" : "UNBANNED"}`);
  },
});

/**
 * Toggles the 'isVerified' status of a user.
 */
export const adminVerifyUser = mutation({
  args: { userId: v.id("users"), isVerified: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdminRole(ctx);
    await ctx.db.patch(args.userId, { isVerified: args.isVerified });
  },
});

/**
 * Manually sets a user's role in the Convex database.
 */
export const adminSetUserRole = mutation({
  args: { userId: v.id("users"), role: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdminRole(ctx);
    await ctx.db.patch(args.userId, { role: args.role });
    console.log(`[Admin] user ${args.userId} role set to: ${args.role || "user"}`);
  },
});

/**
 * --- Story / Product Management (Full Power) ---
 */

/**
 * "God Mode" update for any story field.
 */
export const adminUpdateStory = mutation({
  args: {
    storyId: v.id("stories"),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      longDescription: v.optional(v.string()),
      url: v.optional(v.string()),
      tagIds: v.optional(v.array(v.id("tags"))),
      isHidden: v.optional(v.boolean()),
      isPinned: v.optional(v.boolean()),
      isArchived: v.optional(v.boolean()),
      customMessage: v.optional(v.string()),
      stage: v.optional(
        v.union(v.literal("idea"), v.literal("building"), v.literal("beta"), v.literal("live"))
      ),
      rejectionReason: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdminRole(ctx);
    const story = await ctx.db.get(args.storyId);
    if (!story) throw new Error("Story not found");

    await ctx.db.patch(args.storyId, {
      ...args.updates,
    });
    console.log(`[Admin] story ${args.storyId} was UPDATED by admin`);
  },
});

/**
 * Force set a story's approval status.
 */
export const adminSetStoryStatus = mutation({
  args: {
    storyId: v.id("stories"),
    status: v.union(
      v.literal("approved"),
      v.literal("pending"),
      v.literal("rejected")
    ),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdminRole(ctx);
    await ctx.db.patch(args.storyId, {
      status: args.status,
      isApproved: args.status === "approved",
      rejectionReason: args.rejectionReason,
    });
  },
});

/**
 * --- Content Moderation (Full Power) ---
 */

export const adminModerateComment = mutation({
  args: {
    commentId: v.id("comments"),
    action: v.union(
      v.literal("approve"),
      v.literal("reject"),
      v.literal("hide"),
      v.literal("show"),
      v.literal("delete")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdminRole(ctx);
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    switch (args.action) {
      case "approve":
        await ctx.db.patch(args.commentId, { status: "approved" });
        break;
      case "reject":
        await ctx.db.patch(args.commentId, { status: "rejected" });
        break;
      case "hide":
        await ctx.db.patch(args.commentId, { isHidden: true });
        break;
      case "show":
        await ctx.db.patch(args.commentId, { isHidden: false });
        break;
      case "delete":
        await ctx.db.delete(args.commentId);
        const story = await ctx.db.get(comment.storyId);
        if (story) {
          await ctx.db.patch(story._id, {
            commentCount: Math.max(0, (story.commentCount || 1) - 1),
          });
        }
        break;
    }
  },
});
