import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Diagnostic query to find duplicate user records by clerkId.
 */
export const checkUserDuplicates = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const counts: Record<string, number> = {};
    const detailedUsers: any[] = [];
    
    for (const user of users) {
      counts[user.clerkId] = (counts[user.clerkId] || 0) + 1;
      detailedUsers.push({
        id: user._id,
        clerkId: user.clerkId,
        username: user.username || "EMPTY",
        name: user.name,
        created: new Date(user._creationTime).toLocaleString(),
      });
    }
    
    const duplicates = Object.entries(counts)
      .filter(([_, count]) => count > 1)
      .map(([clerkId, count]) => ({ clerkId, count }));
      
    return {
      totalUsers: users.length,
      duplicateGroups: duplicates,
      allUsers: detailedUsers,
    };
  },
});

/**
 * Cleanup mutation to remove duplicates.
 * Keeps the record that has a username. If neither has a username, keeps the oldest.
 */
export const cleanupDuplicates = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const clerkIdMap = new Map<string, any[]>();
    
    for (const user of users) {
      const existing = clerkIdMap.get(user.clerkId) || [];
      existing.push(user);
      clerkIdMap.set(user.clerkId, existing);
    }
    
    let deletedCount = 0;
    
    for (const [clerkId, recordGroup] of clerkIdMap.entries()) {
      if (recordGroup.length > 1) {
        // Sort: Records with username first, then by creation time (descending)
        const sorted = recordGroup.sort((a, b) => {
          if (a.username && !b.username) return -1;
          if (!a.username && b.username) return 1;
          return a._creationTime - b._creationTime;
        });
        
        // Keep the first (best) one, delete others
        const toKeep = sorted[0];
        const toDelete = sorted.slice(1);
        
        for (const doc of toDelete) {
          await ctx.db.delete(doc._id);
          deletedCount++;
        }
      }
    }
    
    return { deletedCount };
  },
});
