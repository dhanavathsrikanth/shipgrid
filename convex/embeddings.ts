import { internalAction, internalMutation, internalQuery } from "./_generated/server";
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
    const stage = story.stage || "beta";
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
