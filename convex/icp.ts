import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Fetches all ICP options grouped by category.
 * Returns roleCategories (top-level categories), roleSubcategories (map of category -> subcategories),
 * challenges, and budgets.
 */
export const getOptions = query({
  args: {},
  handler: async (ctx) => {
    const options = await ctx.db.query("icpOptions").collect();

    const roleCategories = options
      .filter(o => o.category === "roleCategory")
      .sort((a, b) => a.order - b.order)
      .map(o => o.label);

    const roleSubcategories: Record<string, string[]> = {};
    for (const cat of roleCategories) {
      roleSubcategories[cat] = options
        .filter(o => o.category === "role" && o.parentLabel === cat)
        .sort((a, b) => a.order - b.order)
        .map(o => o.label);
    }

    const challenges = options
      .filter(o => o.category === "challenge")
      .sort((a, b) => a.order - b.order)
      .map(o => o.label);

    const budgets = options
      .filter(o => o.category === "budget")
      .sort((a, b) => a.order - b.order)
      .map(o => o.label);

    const subCount = Object.values(roleSubcategories).flat().length;
    console.log(`ICP Options: ${roleCategories.length} categories, ${subCount} subcategories, ${challenges.length} challenges, ${budgets.length} budgets.`);

    return {
      roleCategories,
      roleSubcategories,
      challenges,
      budgets,
    };
  },
});

/**
 * Seeds the initial ICP options into the database.
 * This can be called once to populate the categories.
 * Call with { clear: true } to wipe and re-seed.
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

    const roleTaxonomy: Record<string, string[]> = {
      "Productivity": [
        "AI Notetakers",
        "AI Presentation Software",
        "AI Workflow Automation",
        "Ad Blockers",
        "App Switchers",
        "Content Management Systems (CMS)",
        "Calendar Apps",
        "Compliance Software",
        "Customer Support Tools",
        "E-Signature Apps",
        "Email Clients",
        "File Storage & Sharing",
        "Hiring Software",
        "Knowledge Base Software",
        "Legal Services",
        "Meeting & Conferencing Tools",
        "Notes & Writing Tools",
        "PDF Editors",
        "Password Managers",
        "Product Demo Tools",
        "Project Management Software",
        "Resume Tools",
        "Scheduling Software",
        "Screen Recording Tools",
        "Search Tools",
        "Security Software",
        "Spreadsheets",
        "Team Collaboration Software",
        "Time Tracking Apps",
        "Virtual Office Platforms",
        "Web Browsers",
      ],
      "Engineering & Development": [
        "A/B Testing Tools",
        "AI Code Editors",
        "AI Coding Agents",
        "AI Databases",
        "Authentication & Identity Tools",
        "Automation Tools",
        "Cloud Computing Platforms",
        "Code Review Tools",
        "Code Editors",
        "Command Line Tools",
        "Databases & Backend Frameworks",
        "Git Clients",
        "Issue Tracking Software",
        "Membership Software",
        "Observability Tools",
        "Predictive AI Tools",
        "Real-time Collaboration Infrastructure",
        "Static Site Generators",
        "Testing & QA Software",
        "Unified API Tools",
        "VPN Clients",
        "Vibe Coding Tools",
        "Video Hosting Platforms",
        "Website Analytics",
        "Website Builders",
      ],
      "Design & Creative": [
        "3D & Animation Tools",
        "AI Characters",
        "AI Generative Media",
        "Background Removal Tools",
        "Camera Apps",
        "Design Inspiration",
        "Design Mockups",
        "Design Resources",
        "Digital Whiteboards",
        "Graphic Design Tools",
        "Icon Sets",
        "Interface Design Tools",
        "Mobile Editing Apps",
        "Music Generation Tools",
        "Photo Editing Tools",
        "Podcasting Tools",
        "Social Audio Apps",
        "Space Design Apps",
        "Stock Photo Sites",
        "UI Frameworks",
        "User Research Tools",
        "Video Editing Tools",
        "Wallpapers",
        "Wireframing Tools",
      ],
      "Finance": [
        "Accounting Software",
        "Budgeting Apps",
        "Credit Score Tools",
        "Financial Planning Tools",
        "Fundraising Resources",
        "Investing Platforms",
        "Invoicing Tools",
        "Money Transfer Tools",
        "Neobanking Platforms",
        "Payroll Software",
        "Retirement Planning Tools",
        "Savings Apps",
        "Startup Financial Planning Tools",
        "Startup Incorporation Tools",
        "Stock Trading Platforms",
        "Tax Preparation Tools",
        "Treasury Management Platforms",
      ],
      "Social & Community": [
        "Blogging Platforms",
        "Community Management Tools",
        "Dating Apps",
        "Link-in-Bio Tools",
        "Live Streaming Platforms",
        "Messaging Apps",
        "Newsletter Platforms",
        "Photo Sharing Platforms",
        "Professional Networking Platforms",
        "Safety & Privacy Platforms",
        "Social Networking Platforms",
        "Social Bookmarking Tools",
        "Voice & Video Calling Tools",
      ],
      "Marketing & Sales": [
        "AI Sales Tools",
        "Advertising Tools",
        "Affiliate Marketing Tools",
        "CRM Software",
        "Customer Loyalty Platforms",
        "Email Marketing Tools",
        "GEO Optimization Tools",
        "Influencer Marketing Platforms",
        "Keyword Research Tools",
        "Landing Page Builders",
        "Lead Generation Software",
        "Marketing Automation Platforms",
        "SEO Tools",
        "Sales Enablement Tools",
        "Social Media Management Tools",
        "Survey & Form Builders",
      ],
      "Health & Fitness": [
        "Activity Tracking Apps",
        "Camping Apps",
        "Health Insurance Platforms",
        "Hiking Apps",
        "Medical Tools",
        "Meditation Apps",
        "Mental Health Tools",
        "Senior Care Tools",
        "Sleep Apps",
        "Workout Platforms",
      ],
      "Travel": [
        "Flight Booking Apps",
        "Hotel Booking Apps",
        "Maps & GPS Tools",
        "Outdoor Platforms",
        "Short-term Rental Platforms",
        "Travel Insurance Tools",
        "Travel Planning Tools",
        "Weather Apps",
      ],
      "Platforms": [
        "Crowdfunding Platforms",
        "Event Management Software",
        "Job Boards",
        "Language Learning Platforms",
        "News Platforms",
        "Online Learning Platforms",
        "Real Estate Platforms",
        "Startup Communities",
      ],
      "Product Add-ons": [
        "Chrome Extensions",
        "Figma Plugins & Templates",
        "Notion Templates",
        "Slack Apps",
        "Twitter (X) Tools",
        "WordPress Plugins & Themes",
      ],
      "AI Agents": [
        "AI Chief of Staff",
        "AI Data Scientist",
        "AI Designer",
        "AI Engineer",
        "AI SDR (Sales Development Representative)",
        "AI Voice Agents",
        "OpenClaw Systems",
      ],
      "Web3": [
        "Crypto Exchanges",
        "Crypto Tools",
        "Crypto Wallets",
        "DAOs (Decentralized Autonomous Organizations)",
        "DeFi Platforms",
        "NFT Platforms",
      ],
      "Physical Products": [
        "Books",
        "Fitness Products",
        "Furniture",
        "Games",
        "Toys",
        "Wearables",
        "Webcams",
      ],
      "LLMs (Large Language Models)": [
        "AI Chatbots",
        "AI Infrastructure Tools",
        "AI Metrics & Evaluation Tools",
        "Foundation Models",
        "LLM Developer Tools",
        "Prompt Engineering Tools",
      ],
      "Voice AI Tools": [
        "AI Dictation Apps",
        "AI Voice Agent Infrastructure",
        "Real-time Voice AI",
        "Text-to-Speech Software",
        "Transcription Tools",
        "Translation Tools",
      ],
      "Ecommerce": [
        "Ecommerce Platforms",
        "Marketplace Platforms",
        "Payment Processors",
        "Shopify Apps",
      ],
      "Data Analysis Tools": [
        "Analytics Databases",
        "Business Intelligence Tools",
        "Data Visualization Tools",
      ],
      "No-code Platforms": [
        "No-code AI Agent Builders",
        "No-code App Builders",
        "No-code Website Builders",
      ],
      "Family": [
        "Apps for Kids",
        "Family Care Tools",
        "Pregnancy Apps",
      ],
      "Lifestyle": [
        "Shopping Tools",
      ],
    };

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

    for (const [category, subcategories] of Object.entries(roleTaxonomy)) {
      await ctx.db.insert("icpOptions", { category: "roleCategory", label: category, order: order++ });
    }

    order = 0;
    for (const [category, subcategories] of Object.entries(roleTaxonomy)) {
      let subOrder = 0;
      for (const sub of subcategories) {
        await ctx.db.insert("icpOptions", { category: "role", label: sub, order: subOrder++, parentLabel: category });
      }
    }

    order = 0;
    for (const c of challenges) {
      await ctx.db.insert("icpOptions", { category: "challenge", label: c, order: order++ });
    }

    order = 0;
    for (const b of budgets) {
      await ctx.db.insert("icpOptions", { category: "budget", label: b, order: order++ });
    }

    const catCount = Object.keys(roleTaxonomy).length;
    const subCount = Object.values(roleTaxonomy).flat().length;
    return `Successfully seeded ${catCount} categories, ${subCount} subcategories, ${challenges.length} challenges, ${budgets.length} budgets.`;
  },
});
