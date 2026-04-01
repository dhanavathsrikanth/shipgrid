import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Fetches all ICP options grouped by category.
 */
export const getOptions = query({
  args: {},
  handler: async (ctx) => {
    const options = await ctx.db.query("icpOptions").collect();
    
    return {
      roles: options.filter(o => o.category === "role").sort((a, b) => a.order - b.order).map(o => o.label),
      challenges: options.filter(o => o.category === "challenge").sort((a, b) => a.order - b.order).map(o => o.label),
      budgets: options.filter(o => o.category === "budget").sort((a, b) => a.order - b.order).map(o => o.label),
    };
  },
});

/**
 * Seeds the initial ICP options into the database.
 * This can be called once to populate the categories.
 */
export const seedOptions = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("icpOptions").first();
    if (existing) {
      // Clear old options if you want to re-seed, or just return
      // For now, let's just return if any exist to avoid duplicates
      return "Options already seeded.";
    }

    const roles = [
      "Founder / Co-Founder",
      "Product Manager",
      "Growth / Marketing Specialist",
      "Full-Stack Developer",
      "UI/UX Designer",
      "VC / Angel Investor",
      "Sales / BusDev",
      "Tech Consultant",
      "AI / ML Engineer",
      "Student / Aspiring Builder",
      "Content Creator",
      "Operations / HR"
    ];

    const challenges = [
      "Validating a new idea",
      "Acquiring first 100 customers",
      "Scaling infrastructure",
      "Raising Capital",
      "Improving retention",
      "Automating workflows",
      "Building personal brand",
      "Finding co-founder",
      "Optimizing conversion",
      "Exploring tech stacks",
      "Monetizing product",
      "Market expansion"
    ];

    const budgets = [
      "$0 (Bootstrap)",
      "$1 - $50 / mo",
      "$50 - $250 / mo",
      "$250 - $1,000 / mo",
      "$1,000 - $5,000 / mo",
      "$5,000+ / mo"
    ];

    let order = 0;
    
    for (const r of roles) {
      await ctx.db.insert("icpOptions", { category: "role", label: r, order: order++ });
    }
    
    order = 0;
    for (const c of challenges) {
      await ctx.db.insert("icpOptions", { category: "challenge", label: c, order: order++ });
    }
    
    order = 0;
    for (const b of budgets) {
      await ctx.db.insert("icpOptions", { category: "budget", label: b, order: order++ });
    }

    return "Successfully seeded 30+ options.";
  },
});
