import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "../_generated/dataModel";
import { requireAdminRole } from "../users";
import { paginationOptsValidator } from "convex/server";

/**
 * --- User Management ---
 */

/**
 * Toggles the 'isBanned' status of a user.
 */
export const adminBanUser = mutation({
  args: { userId: v.id("users"), isBanned: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdminRole(ctx);
    await ctx.db.patch(args.userId, { isBanned: args.isBanned });
    
    // Log the event or potentially revoke sessions if banning
    console.log(`[Admin] user ${args.userId} was ${args.isBanned ? 'BANNED' : 'UNBANNED'}`);
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
 * Use this to promote/demote admins within the application.
 */
export const adminSetUserRole = mutation({
  args: { userId: v.id("users"), role: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdminRole(ctx);
    await ctx.db.patch(args.userId, { role: args.role });
    console.log(`[Admin] user ${args.userId} role set to: ${args.role || 'user'}`);
  },
});

/**
 * Paginated list of all users for the admin dashboard.
 */
export const adminListAllUsers = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdminRole(ctx);
    
    if (args.searchTerm && args.searchTerm.trim() !== "") {
      return await ctx.db
        .query("users")
        .withSearchIndex("search_users", (q) => q.search("name", args.searchTerm!))
        .paginate(args.paginationOpts);
    }
    
    return await ctx.db
      .query("users")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * --- Story / Product Management ---
 */

/**
 * "God Mode" update for any story field.
 * Bypasses ownership checks.
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
      stage: v.optional(v.union(v.literal("building"), v.literal("beta"), v.literal("live"))),
      rejectionReason: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdminRole(ctx);
    
    const story = await ctx.db.get(args.storyId);
    if (!story) throw new Error("Story not found");
    
    await ctx.db.patch(args.storyId, {
      ...args.updates,
      updatedAt: Date.now(),
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
    status: v.union(v.literal("approved"), v.literal("pending"), v.literal("rejected")),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdminRole(ctx);
    
    await ctx.db.patch(args.storyId, { 
      status: args.status,
      isApproved: args.status === "approved",
      rejectionReason: args.rejectionReason,
      updatedAt: Date.now(),
    });
  },
});

/**
 * --- Moderation ---
 */

/**
 * Generic moderation for any comment.
 */
export const adminModerateComment = mutation({
  args: { 
    commentId: v.id("comments"), 
    action: v.union(v.literal("approve"), v.literal("reject"), v.literal("hide"), v.literal("show"), v.literal("delete")) 
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
        // Optional: decrement commentCount on story
        const story = await ctx.db.get(comment.storyId);
        if (story) {
           await ctx.db.patch(story._id, { commentCount: Math.max(0, (story.commentCount || 1) - 1) });
        }
        break;
    }
  },
});

/**
 * Resolve or dismiss a user/story report.
 */
export const adminResolveReport = mutation({
  args: { 
    reportId: v.union(v.id("reports"), v.id("userReports")), 
    resolution: v.string(),
    dismiss: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdminRole(ctx);
    
    // We need to check both tables as the union id doesn't tell us which table it is in directly
    // but the ID type itself has the table name in Convex if we use v.id("table")
    // but here we used union.
    
    // Better way: check the table name from the ID
    const report: any = await ctx.db.get(args.reportId as any);
    if (!report) throw new Error("Report not found");
    
    // Patch based on the schema status types
    if ("reporterUserId" in report) {
       // userReports or reports
       await ctx.db.patch(args.reportId as any, { 
         status: args.dismiss ? "dismissed" : (args.resolution as any) 
       });
    }
  },
});
