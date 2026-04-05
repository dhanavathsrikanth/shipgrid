import { action, query, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export const generateFaqs = internalAction({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const story = await ctx.runQuery(internal.stories.getStoryByIdInternal, { storyId: args.storyId });
    if (!story) return;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("OPENROUTER_API_KEY not set");
      return;
    }

    const prompt = `
      You are an AI SEO Specialist for "Shipgrid", a platform for launching and discovering apps.
      Generate 3 Frequently Asked Questions (FAQs) for the following product to improve its visibility in AI search engines (like ChatGPT or Perplexity).
      
      Product Title: ${story.title}
      Tagline: ${story.description}
      Description: ${story.longDescription || "No detailed description provided."}
      
      Target Audience roles: ${story.icpRoles?.join(", ") || "Founders and Developers"}
      Problem it solves: ${story.icpProblem || "Not specified"}
      
      Output ONLY a JSON array of objects with "question" and "answer" fields. Do not include any other text.
      Example: [{"question": "What is X?", "answer": "X is a tool that..."}]
    `;

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://goshipgrid.app",
          "X-Title": "Shipgrid AI SEO",
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) throw new Error(`OpenRouter error: ${response.statusText}`);

      const json = await response.json();
      const content = json.choices[0].message.content;
      const faqs = JSON.parse(content.trim());

      if (Array.isArray(faqs)) {
        await ctx.runMutation(internal.seo.updateStoryFaqs, {
          storyId: args.storyId,
          faqs: faqs.slice(0, 5),
        });
      }
    } catch (error) {
      console.error("Failed to generate FAQs:", error);
    }
  },
});

export const updateStoryFaqs = internalMutation({
  args: { 
    storyId: v.id("stories"), 
    faqs: v.array(v.object({ question: v.string(), answer: v.string() })) 
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.storyId, { faqs: args.faqs });
  },
});

export const pingIndexNow = internalAction({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    // Placeholder for future SEO IndexNow functionality
    // This is called when a product moves to 'live' stage
    console.log(`Ping IndexNow for story slug: ${args.slug}`);
    return;
  },
});

export const runAudit = action({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const story = await ctx.runQuery(internal.stories.getStoryByIdInternal, { storyId: args.storyId });
    if (!story) return;

    // Simple scoring logic for the UI Analytics
    // In a real app, this would involve fetching the URL and parsing HTML.
    // For this implementation, we will use story data to simulate the audit.
    
    let contentScore = 0;
    let schemaScore = 0;
    let brandScore = 0;
    const issues = [];

    // 1. Content Score (0-100)
    if (story.description.length > 50) contentScore += 30;
    if (story.longDescription && story.longDescription.length > 200) contentScore += 40;
    if (story.faqs && story.faqs.length >= 3) contentScore += 30;
    else issues.push({ type: "content", severity: "warning", message: "Add at least 3 FAQs to improve AI context density." } as const);

    // 2. Schema Score (0-100)
    // We assume the frontend implements these if these fields are present in DB
    if (story.url) schemaScore += 40;
    if (story.faqs) schemaScore += 60;
    else issues.push({ type: "schema", severity: "critical", message: "Missing FAQPage JSON-LD schema." } as const);

    // 3. Brand Score (0-100)
    if (story.title) brandScore += 50;
    if (story.icpRoles && story.icpRoles.length > 0) brandScore += 50;
    else issues.push({ type: "brand", severity: "suggestion", message: "Define target roles to help AI recommend your app to the right users." } as const);

    const overallScore = Math.round((contentScore + schemaScore + brandScore) / 3);

    await ctx.runMutation(internal.seo.saveAuditReport, {
      storyId: args.storyId,
      overallScore,
      contentScore,
      schemaScore,
      brandScore,
      issues,
    });
  },
});

export const saveAuditReport = internalMutation({
  args: {
    storyId: v.id("stories"),
    overallScore: v.number(),
    contentScore: v.number(),
    schemaScore: v.number(),
    brandScore: v.number(),
    issues: v.array(v.object({ type: v.string(), severity: v.union(v.literal("critical"), v.literal("warning"), v.literal("suggestion")), message: v.string() })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("seoReports")
      .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
      .unique();

    const data = {
      ...args,
      scannedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("seoReports", data);
    }
  },
});

export const getLatestReport = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("seoReports")
      .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
      .unique();
  },
});

export const getGlobalStats = query({
  handler: async (ctx) => {
    const reports = await ctx.db.query("seoReports").collect();
    if (reports.length === 0) return { avgScore: 0, totalAudited: 0, criticalIssues: 0 };

    const totalScore = reports.reduce((acc, r) => acc + r.overallScore, 0);
    const criticalIssues = reports.reduce((acc, r) => acc + r.issues.filter(i => i.severity === "critical").length, 0);

    return {
      avgScore: Math.round(totalScore / reports.length),
      totalAudited: reports.length,
      criticalIssues,
    };
  },
});

export const listStoriesWithReports = query({
  handler: async (ctx) => {
    const stories = await ctx.db.query("stories").order("desc").collect();
    const reports = await ctx.db.query("seoReports").collect();
    
    return stories.map(story => {
      const report = reports.find(r => r.storyId === story._id);
      return {
        _id: story._id,
        title: story.title,
        slug: story.slug,
        report: report || null,
      };
    });
  },
});


