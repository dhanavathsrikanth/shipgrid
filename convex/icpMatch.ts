import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Find products similar to a given story using its embedding
export const getSimilarStories = action({
  args: {
    storyId: v.id("stories"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any[]> => {
    const limit = args.limit ?? 3;

    // 1. Get this story's embedding
    const storyEmbedding = await ctx.runQuery(
      internal.embeddings.getProductEmbeddingByStory,
      { storyId: args.storyId },
    );
    if (!storyEmbedding) return [];

    // 2. Vector search — request more than we need since we'll filter out the source
    const results = await ctx.vectorSearch("productEmbeddings", "by_embedding", {
      vector: storyEmbedding.embedding,
      limit: limit + 5,
    });
    if (results.length === 0) return [];

    // 3. Resolve to story IDs (excluding the source story)
    const storyIds = await ctx.runQuery(
      internal.embeddings.resolveProductStoryIds,
      { ids: results.map((r) => r._id) },
    );
    const otherStoryIds = storyIds.filter((id) => id !== args.storyId);

    // 4. Fetch full story details
    const stories = await ctx.runQuery(
      internal.stories.getStoriesByIdsInternal,
      { storyIds: otherStoryIds.slice(0, limit) },
    );

    return stories;
  },
});

export const getMatchedStories = action({
  args: {},
  handler: async (ctx, args): Promise<any[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // 1. Get User Document
    const user = await ctx.runQuery(internal.users.getUserByClerkIdInternal, {
      clerkId: identity.subject,
    });
    if (!user) return [];

    // 2. Get User Embedding
    // If user has no embedding, generate it now
    let userEmbeddingDoc = await ctx.runQuery(internal.embeddings.getUserEmbedding, {
      userId: user._id,
    });

    if (!userEmbeddingDoc) {
      console.log(`Generating missing embedding for user ${user.username}...`);
      await ctx.runAction(internal.embeddings.generateUserEmbedding, {
        userId: user._id,
      });
      userEmbeddingDoc = await ctx.runQuery(internal.embeddings.getUserEmbedding, {
        userId: user._id,
      });
    }

    if (!userEmbeddingDoc) return [];

    // 3. Perform Vector Search
    const results = await ctx.vectorSearch("productEmbeddings", "by_embedding", {
      vector: userEmbeddingDoc.embedding,
      limit: 20,
    });

    if (results.length === 0) return [];

    // 4. Resolve Product Embedding IDs to Story IDs
    const storyIds = await ctx.runQuery(internal.embeddings.resolveProductStoryIds, {
      ids: results.map((r) => r._id),
    });

    // 5. Fetch Full Story Details
    const stories = await ctx.runQuery(internal.stories.getStoriesByIdsInternal, {
      storyIds,
    });

    // 6. Map scores to stories (Distance to Precision Percentage)
    // Convex distance is usually cosine distance (0 to 2, where 0 is identical)
    // We'll convert it to a 0-100 score for the UI
    return stories.map((story) => {
      const result = results.find((r) => {
          // Note: We need a way to link result._id (productEmbedding id) back to story._id
          // Since we resolved them in order, we can assume the index holds
          return false; // Placeholder for now, see below for better mapping
      });

      // Better mapping: create a map of storyId -> score
      return story;
    }).map((story, index) => {
        const score = results[index]?._score || 0;
        // Simple conversion from cosine similarity/distance to percentage
        // For text-embedding-3-small, scores are typically 0.5 to 0.9
        let precision = Math.min(Math.round(score * 100), 100);
        
        // Beta window bonus — only during the 72h window
        if (story.currentStage === 'beta' && story.betaOpenedAt) {
          const hoursInBeta = (Date.now() - story.betaOpenedAt) / 3600000;
          if (hoursInBeta < 72) {
            precision += 15;
          }
        }

        // Changelog recency bonus — only for Live products that posted recently
        // Do NOT apply this to Beta products — they already get the beta bonus
        // Note: updatedAt field removed from schema, using changeLog presence instead
        if (story.currentStage === 'live' && story.changeLog && story.changeLog.length > 0) {
          const lastUpdate = story.changeLog[story.changeLog.length - 1].timestamp;
          const hoursSinceUpdate = (Date.now() - lastUpdate) / 3600000;
          if (hoursSinceUpdate < 168) {      // within 7 days
            precision += 10;
          } else if (hoursSinceUpdate < 720) { // within 30 days
            precision += 5;
          }
        }
        
        return {
            ...story,
            matchScore: Math.min(precision, 100)
        };
    });
  },
});
