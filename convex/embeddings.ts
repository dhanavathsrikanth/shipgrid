import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/embeddings";

export const generateEmbedding = internalAction({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY not set in Convex dashboard");
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://goshipgrid.app",
        "X-Title": "Shipgrid",
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input: args.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter Embedding API Error:", error);
      throw new Error(`Failed to generate embedding: ${response.statusText}`);
    }

    const json = await response.json();
    return json.data[0].embedding as number[];
  },
});

export const generateUserEmbedding = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getUserByIdInternal, { userId: args.userId });
    if (!user) return;

    const roles = user.icpRoles?.join(", ") || user.role || "Builder";
    const problem = user.primaryProblem || "Unknown Challenge";
    const budget = user.budgetRange || "Bootstrap";
    
    // Create a rich semantic description of the user's professional interests
    const text = `User Profile:
Roles/Interests: ${roles}
Primary Challenge/Pain Point: ${problem}
Investment Capacity: ${budget}
This user is looking for solutions that solve ${problem} and align with being a ${roles}.`;

    const embedding = await ctx.runAction(internal.embeddings.generateEmbedding, { text });

    await ctx.runMutation(internal.embeddings.updateUserEmbedding, {
      userId: args.userId,
      embedding,
    });
  },
});

export const generateProductEmbedding = internalAction({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const story = await ctx.runQuery(internal.stories.getStoryByIdInternal, { storyId: args.storyId });
    if (!story || !story.isApproved) return;

    const roles = story.icpRoles?.join(", ") || "Founders and Developers";
    const problem = story.icpProblem || story.description;
    const stage = story.currentStage || "beta";
    const notFor = story.notFor ? ` It is explicitly NOT for ${story.notFor}.` : "";
    
    // Create a rich semantic description of the product and its Target Audience (ICP)
    const text = `Product Listing: ${story.title}
Tagline: ${story.description}
Problem Solved: ${problem}
Target Audience Roles: ${roles}
Product Stage: ${stage}${notFor}
This product is designed for ${roles} facing the challenge of ${problem}.`;

    const embedding = await ctx.runAction(internal.embeddings.generateEmbedding, { text });

    await ctx.runMutation(internal.embeddings.updateProductEmbedding, {
      storyId: args.storyId,
      embedding,
    });
  },
});

export const updateUserEmbedding = internalMutation({
  args: { userId: v.id("users"), embedding: v.array(v.float64()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userEmbeddings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { embedding: args.embedding });
    } else {
      await ctx.db.insert("userEmbeddings", {
        userId: args.userId,
        embedding: args.embedding,
      });
    }
  },
});

export const getUserEmbedding = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userEmbeddings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const getProductEmbeddingByStory = internalQuery({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("productEmbeddings")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .unique();
  },
});

export const updateProductEmbedding = internalMutation({
  args: { storyId: v.id("stories"), embedding: v.array(v.float64()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("productEmbeddings")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { embedding: args.embedding });
    } else {
      await ctx.db.insert("productEmbeddings", {
        storyId: args.storyId,
        embedding: args.embedding,
      });
    }
  },
});

export const resolveProductStoryIds = internalQuery({
  args: { ids: v.array(v.id("productEmbeddings")) },
  handler: async (ctx, args) => {
    const docs = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return docs.filter((d): d is Doc<"productEmbeddings"> => d !== null).map((d) => d.storyId);
  },
});

/**
 * Public AI intent/semantic search.
 * Generates an embedding for the user's natural-language query and runs
 * a vector search against productEmbeddings. Returns full story details,
 * ordered by similarity, with a matchScore (0-100) attached.
 */
export const semanticSearchStories = action({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any[]> => {
    const term = args.searchTerm.trim();
    if (term.length < 2) return [];

    const limit = args.limit ?? 20;

    // 1. Rewrite the query as a semantic description so it matches the
    //    product-embedding text format (problem + audience + stage).
    const searchText = `Looking for a product that solves: ${term}. Describes the problem, target audience, and use case.`;

    // 2. Generate embedding via OpenRouter
    const embedding: number[] = await ctx.runAction(
      internal.embeddings.generateEmbedding,
      { text: searchText },
    );

    // 3. Vector search
    const results = await ctx.vectorSearch("productEmbeddings", "by_embedding", {
      vector: embedding,
      limit,
    });
    if (results.length === 0) return [];

    // 4. Resolve embedding docs -> story IDs (preserve order)
    const storyIds = await ctx.runQuery(
      internal.embeddings.resolveProductStoryIds,
      { ids: results.map((r) => r._id) },
    );

    // 5. Fetch full story details (also preserves order since we pass storyIds as-is)
    const stories: any[] = await ctx.runQuery(
      internal.stories.getStoriesByIdsInternal,
      { storyIds },
    );

    // 6. Attach matchScore (0-100) from cosine similarity score
    return stories.map((story, i) => {
      const score = results[i]?._score ?? 0;
      const matchScore = Math.max(0, Math.min(100, Math.round(score * 100)));
      return { ...story, matchScore };
    });
  },
});
