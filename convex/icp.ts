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
  args: { clear: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.clear) {
      const existing = await ctx.db.query("icpOptions").collect();
      for (const item of existing) {
        await ctx.db.delete(item._id);
      }
    } else {
      const existing = await ctx.db.query("icpOptions").first();
      if (existing) {
        return "Options already seeded. Use { clear: true } to re-seed.";
      }
    }

    const roles = [
      "SaaS Founder",
      "Indie Hacker",
      "Solopreneur",
      "Full-Stack Developer",
      "Frontend Engineer",
      "Backend Engineer",
      "AI / ML Engineer",
      "Product Manager",
      "UI/UX Designer",
      "Growth Marketer",
      "Content Creator",
      "VC / Angel Investor",
      "No-Code Builder",
      "Engineering Manager",
      "Student / Aspiring Builder"
    ];

    const challenges = [
      "Validating a product idea",
      "Getting first 100 customers",
      "Scaling to 1,000+ users",
      "Finding a Co-Founder",
      "Building a technical MVP",
      "Raising early-stage capital",
      "Improving user retention",
      "Automating manual workflows",
      "Building a personal brand",
      "Optimizing SEO / Growth",
      "Monetizing a side project",
      "Market / Niche research",
      "Tech stack consultation",
      "Hiring first employees"
    ];

    const budgets = [
      "$0 (Bootstrap / Free)",
      "$1 - $50 / month",
      "$50 - $250 / month",
      "$250 - $1,000 / month",
      "$1,000 - $5,000 / month",
      "$5,000+ / month",
      "Enterprise Level"
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

    return "Successfully seeded " + (roles.length + challenges.length + budgets.length) + " options.";
  },
});
