import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAdminRole } from "../users";
import { paginationOptsValidator } from "convex/server";

/**
 * Consolidated platform overview for the admin dashboard.
 */
export const getAdminOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdminRole(ctx);

    const [
      totalUsers,
      totalStories,
      totalComments,
      totalVotes,
      pendingReports,
      totalProductFollows,
    ] = await Promise.all([
      ctx.db.query("users").collect().then(docs => docs.length),
      ctx.db.query("stories").collect().then(docs => docs.length),
      ctx.db.query("comments").collect().then(docs => docs.length),
      ctx.db.query("votes").collect().then(docs => docs.length),
      ctx.db.query("reports").withIndex("by_status", q => q.eq("status", "pending")).collect().then(docs => docs.length),
      ctx.db.query("product_follows").collect().then(docs => docs.length),
    ]);

    // Breakdown stories by stage
    const stories = await ctx.db.query("stories").collect();
    const stageBreakdown = {
      idea: stories.filter(s => s.currentStage === "idea").length,
      building: stories.filter(s => s.currentStage === "building").length,
      beta: stories.filter(s => s.currentStage === "beta").length,
      live: stories.filter(s => s.currentStage === "live").length,
      undefined: stories.filter(s => !s.currentStage).length,
    };

    return {
      stats: {
        totalUsers,
        totalStories,
        totalComments,
        totalVotes,
        pendingReports,
        totalProductFollows,
      },
      stageBreakdown,
    };
  },
});

/**
 * Paginated list of all users for the admin dashboard.
 */
export const adminListAllUsers = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    searchTerm: v.optional(v.string()),
    filterBanned: v.optional(v.boolean()),
    filterVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdminRole(ctx);
    
    let baseQuery = ctx.db.query("users");
    
    // We can't combine filters and search index easily in Convex query syntax
    // If searching, we use the search index. If not, we can apply filters.
    
    if (args.searchTerm && args.searchTerm.trim() !== "") {
      return await ctx.db
        .query("users")
        .withSearchIndex("search_users", (q) => q.search("name", args.searchTerm!))
        .paginate(args.paginationOpts);
    }
    
    // Fallback to basic list with ordering
    return await ctx.db
      .query("users")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * Growth data for charts.
 */
export const getUserGrowthData = query({
  args: {},
  handler: async (ctx) => {
    await requireAdminRole(ctx);
    const users = await ctx.db.query("users").order("asc").collect();
    if (users.length === 0) return [];
    
    const usersByDate = new Map<string, number>();
    for (const user of users) {
      const dateKey = new Date(user._creationTime).toISOString().split("T")[0];
      usersByDate.set(dateKey, (usersByDate.get(dateKey) || 0) + 1);
    }
    
    const sortedDates = Array.from(usersByDate.keys()).sort();
    let cumulative = 0;
    return sortedDates.map(date => {
      const count = usersByDate.get(date) || 0;
      cumulative += count;
      return { date, count, cumulative };
    });
  },
});
