import { internalMutation } from "./_generated/server";

/**
 * Checks for coordinated voting rings or spike in suspicious votes.
 * Flags stories that have received a disproportionate amount of suspicious activity.
 * Runs daily via crons.ts
 */
export const detectCoordinatedVoting = internalMutation({
  args: {},
  handler: async (ctx) => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    // We fetch votes from the last 24 hours that are flagged as suspicious
    // Since we don't have an index by votedAt, we can approximate by fetching
    // recent stories that had high vote velocity, or just scan all recent votes.
    // Instead of scanning all, let's find stories that got updated recently
    // and check their votes. A better way for Convex is to get all votes created
    // in the last 24h by indexing on _creationTime maybe? There is an implicit by_creation_time index.

    const recentVotes = await ctx.db
      .query("votes")
      .order("desc")
      .filter((q) => q.gte(q.field("_creationTime"), oneDayAgo))
      .collect();

    // Group suspicious votes by story
    const suspiciousCountByStory: Record<string, number> = {};
    for (const vote of recentVotes) {
      if (vote.isSuspicious) {
        suspiciousCountByStory[vote.storyId] = (suspiciousCountByStory[vote.storyId] || 0) + 1;
      }
    }

    // Flag stories with more than 10 suspicious votes in the last day
    for (const [storyId, count] of Object.entries(suspiciousCountByStory)) {
      if (count >= 10) {
        // Flag for admin review
        await ctx.db.patch(storyId as any, { suspiciousActivityFlag: true });
      }
    }
  },
});
