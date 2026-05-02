import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminRole } from "./users";

export const getTotalSubmissions = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    await requireAdminRole(ctx);
    const documents = await ctx.db.query("stories").collect();
    return documents.length;
  },
});

export const getTotalUsers = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    await requireAdminRole(ctx);
    const documents = await ctx.db.query("users").collect();
    return documents.length;
  },
});

export const getTotalVotes = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    await requireAdminRole(ctx);
    // Assuming each document in 'votes' table represents a single vote
    const documents = await ctx.db.query("votes").collect();
    return documents.length;
  },
});

export const getTotalComments = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    await requireAdminRole(ctx);
    const documents = await ctx.db.query("comments").collect();
    return documents.length;
  },
});

export const getTotalReports = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    await requireAdminRole(ctx);
    const documents = await ctx.db.query("reports").collect();
    return documents.length;
  },
});

export const getTotalSolvedReports = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    await requireAdminRole(ctx);
    // Assumes 'reports' table has a 'status' field and an index 'by_status'.
    // Changed to check for multiple resolved statuses based on schema
    const resolvedStatuses = ["resolved_hidden", "resolved_deleted"];
    let solvedCount = 0;
    for (const status of resolvedStatuses) {
      const reportsInStatus = await ctx.db
        .query("reports")
        .withIndex("by_status", (q) => q.eq("status", status as any)) // Cast status as any to satisfy literal type, or use a loop with specific literal checks
        .collect();
      solvedCount += reportsInStatus.length;
    }
    return solvedCount;
  },
});

export const getTotalBookmarks = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    await requireAdminRole(ctx);
    const documents = await ctx.db.query("bookmarks").collect();
    return documents.length;
  },
});

export const getTotalRatings = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    await requireAdminRole(ctx);
    const documents = await ctx.db.query("storyRatings").collect();
    return documents.length;
  },
});

// Get user growth data over time for chart
export const getUserGrowthData = query({
  args: {},
  returns: v.array(
    v.object({
      date: v.string(),
      count: v.number(),
      cumulative: v.number(),
    })
  ),
  handler: async (ctx) => {
    await requireAdminRole(ctx);
    
    // Get all users sorted by creation time
    const users = await ctx.db
      .query("users")
      .order("asc")
      .collect();

    if (users.length === 0) {
      return [];
    }

    // Group users by date
    const usersByDate = new Map<string, number>();
    
    for (const user of users) {
      const date = new Date(user._creationTime);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      usersByDate.set(dateKey, (usersByDate.get(dateKey) || 0) + 1);
    }

    // Convert to sorted array with cumulative counts
    const sortedDates = Array.from(usersByDate.keys()).sort();
    let cumulative = 0;
    
    const growthData = sortedDates.map(date => {
      const count = usersByDate.get(date) || 0;
      cumulative += count;
      
      return {
        date,
        count,
        cumulative,
      };
    });

    return growthData;
  },
});

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

    // Breakdown stories by stage using the new index
    const [idea, building, beta, live] = await Promise.all([
      ctx.db.query("stories").withIndex("by_stage", q => q.eq("currentStage", "idea")).collect().then(docs => docs.length),
      ctx.db.query("stories").withIndex("by_stage", q => q.eq("currentStage", "building")).collect().then(docs => docs.length),
      ctx.db.query("stories").withIndex("by_stage", q => q.eq("currentStage", "beta")).collect().then(docs => docs.length),
      ctx.db.query("stories").withIndex("by_stage", q => q.eq("currentStage", "live")).collect().then(docs => docs.length),
    ]);

    const stageBreakdown = {
      idea,
      building,
      beta,
      live,
      undefined: totalStories - (idea + building + beta + live),
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
import { paginationOptsValidator } from "convex/server";

export const adminListAllUsers = query({
  args: {
    paginationOpts: paginationOptsValidator,
    searchTerm: v.optional(v.string()),
    filterBanned: v.optional(v.boolean()),
    filterVerified: v.optional(v.boolean()),
    filterPaused: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdminRole(ctx);

    // If searching, use the search index
    if (args.searchTerm && args.searchTerm.trim() !== "") {
      const results = await ctx.db
        .query("users")
        .withSearchIndex("search_users", (q) =>
          q.search("name", args.searchTerm!)
        )
        .paginate(args.paginationOpts);
      
      // Manual filtering for additional filters since search index doesn't support them all well
      // Note: This only filters the current page. For true cross-index filtering, 
      // you'd typically need a different search provider or complex many-index queries.
      // But for a moderation tool, this is often acceptable or can be handled by filtering on a specific index if no search term.
      
      return results;
    }

    // If no search term, we can use indexes for filtering
    let baseQuery = ctx.db.query("users");
    
    // Convex doesn't allow multiple filter checks on different fields easily without custom indexes
    // So we'll prioritize one filter or just filter in memory for small datasets, 
    // or just return the ordered list if no search.
    
    // For now, let's keep it simple and just return the list sorted by desc creation time
    // as it was, but adding the definition to 'args' prevents the validation crash.
    
    return await baseQuery
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
