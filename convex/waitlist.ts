import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getUserByCtx } from "./users";
import { internal } from "./_generated/api";

// ─── GENERATE UNIQUE REFERRAL CODE ─────────────────────────────
function generateReferralCode(storyId: string, email: string): string {
  // Create a short unique code: first 4 chars of storyId + timestamp last 6 digits
  const timestamp = Date.now().toString().slice(-6);
  const prefix = storyId.slice(-4).replace(/[^a-zA-Z0-9]/g, "x");
  return `${prefix}${timestamp}`;
}

// ─── CALCULATE ICP MATCH SCORE FOR WAITLIST SIGNUP ─────────────
function calculateWaitlistIcpMatch(
  signup: { role?: string; problem?: string; budgetRange?: string },
  story: { icpRoles?: string[]; icpProblem?: string; icpBudget?: string }
): number {
  let score = 0;

  // Role match — 40 points
  if (signup.role && story.icpRoles?.length) {
    const roleMatch = story.icpRoles.some((r) =>
      r.toLowerCase().includes(signup.role!.toLowerCase()) ||
      signup.role!.toLowerCase().includes(r.toLowerCase())
    );
    if (roleMatch) score += 40;
  }

  // Problem match — 35 points (keyword overlap)
  if (signup.problem && story.icpProblem) {
    const signupWords = signup.problem.toLowerCase().split(/\s+/);
    const storyWords = story.icpProblem.toLowerCase().split(/\s+/);
    const overlap = signupWords.filter(
      (w) => w.length > 3 && storyWords.includes(w)
    );
    if (overlap.length >= 2) score += 35;
    else if (overlap.length === 1) score += 15;
  }

  // Budget match — 25 points
  if (signup.budgetRange && story.icpBudget) {
    if (signup.budgetRange === story.icpBudget) score += 25;
  }

  return score;
}

// ─── JOIN WAITLIST ──────────────────────────────────────────────
export const joinWaitlist = mutation({
  args: {
    storyId: v.id("stories"),
    email: v.string(),
    role: v.optional(v.string()),
    problem: v.optional(v.string()),
    budgetRange: v.optional(v.string()),
    referredBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Idempotent — cannot join the same waitlist twice with same email
    const existing = await ctx.db
      .query("waitlist_signups")
      .withIndex("by_email_story", (q) =>
        q.eq("email", args.email).eq("storyId", args.storyId)
      )
      .first();

    if (existing)
      return { alreadyJoined: true, position: existing.queuePosition };

    const story = await ctx.db.get(args.storyId);
    if (!story) throw new Error("Product not found");
    if (!story.waitlistEnabled) throw new Error("Waitlist not enabled for this product");

    // Calculate ICP match
    const icpScore = calculateWaitlistIcpMatch(
      { role: args.role, problem: args.problem, budgetRange: args.budgetRange },
      {
        icpRoles: story.icpRoles,
        icpProblem: story.icpProblem,
        icpBudget: story.icpBudget,
      }
    );
    const isMatch = icpScore >= 50;

    // Get current waitlist count for position
    const currentCount = story.waitlistCount ?? 0;
    const newPosition = currentCount + 1;

    // Generate unique referral code
    const referralCode = generateReferralCode(args.storyId, args.email);

    // Insert signup
    const signupId = await ctx.db.insert("waitlist_signups", {
      storyId: args.storyId,
      email: args.email,
      role: args.role,
      problem: args.problem,
      budgetRange: args.budgetRange,
      icpMatchScore: icpScore,
      referralCode,
      referredBy: args.referredBy,
      referralCount: 0,
      queuePosition: newPosition,
      joinedAt: Date.now(),
      isIcpMatch: isMatch,
    });

    // Update story waitlist counts
    await ctx.db.patch(args.storyId, {
      waitlistCount: newPosition,
      icpMatchedWaitlistCount: (story.icpMatchedWaitlistCount ?? 0) + (isMatch ? 1 : 0),
    });

    // If referred, credit the referrer
    if (args.referredBy) {
      const referrer = await ctx.db
        .query("waitlist_signups")
        .withIndex("by_referral_code", (q) => q.eq("referralCode", args.referredBy!))
        .first();
      if (referrer) {
        const newCount = (referrer.referralCount ?? 0) + 1;
        // Move referrer up 20 positions per referral (up to max position improvement of 100)
        const positionBonus = Math.min(newCount * 20, 100);
        await ctx.db.patch(referrer._id, {
          referralCount: newCount,
          queuePosition: Math.max(1, referrer.queuePosition - 20),
        });
      }
    }

    return {
      alreadyJoined: false,
      position: newPosition,
      icpMatchScore: icpScore,
      isMatch,
      referralCode,
      signupId,
    };
  },
});

// ─── ENABLE WAITLIST FOR A PRODUCT ─────────────────────────────
export const enableWaitlist = mutation({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const user = await getUserByCtx(ctx);
    if (!user) throw new Error("Not authenticated");

    const story = await ctx.db.get(args.storyId);
    if (!story) throw new Error("Story not found");
    if (story.userId !== user._id) throw new Error("Not authorised");

    await ctx.db.patch(args.storyId, {
      waitlistEnabled: true,
      hasWaitlistPage: true,
      waitlistCount: story.waitlistCount ?? 0,
      icpMatchedWaitlistCount: story.icpMatchedWaitlistCount ?? 0,
    });

    return null;
  },
});

// ─── GET WAITLIST PUBLIC DATA (for display to all users) ────────
export const getWaitlistPublicData = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const story = await ctx.db.get(args.storyId);
    if (!story || !story.waitlistEnabled) return null;

    const signups = await ctx.db
      .query("waitlist_signups")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect();

    // Role breakdown
    const roleCounts: Record<string, number> = {};
    const problemCounts: Record<string, number> = {};
    const budgetCounts: Record<string, number> = {};

    for (const s of signups) {
      if (s.role) roleCounts[s.role] = (roleCounts[s.role] ?? 0) + 1;
      if (s.problem) problemCounts[s.problem] = (problemCounts[s.problem] ?? 0) + 1;
      if (s.budgetRange) budgetCounts[s.budgetRange] = (budgetCounts[s.budgetRange] ?? 0) + 1;
    }

    const total = signups.length;
    const icpMatched = signups.filter((s) => s.isIcpMatch).length;
    const icpMatchPct = total > 0 ? Math.round((icpMatched / total) * 100) : 0;

    return {
      total,
      icpMatched,
      icpMatchPct,
      roleBreakdown: Object.entries(roleCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([role, count]) => ({
          role,
          count,
          pct: Math.round((count / total) * 100),
        })),
      topProblems: Object.entries(problemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([problem]) => problem),
    };
  },
});

// ─── GET WAITLIST FOUNDER DATA (private — only story owner) ────
export const getWaitlistFounderData = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const user = await getUserByCtx(ctx);
    if (!user) return null;

    const story = await ctx.db.get(args.storyId);
    if (!story || story.userId !== user._id) return null;

    const signups = await ctx.db
      .query("waitlist_signups")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect();

    // Full breakdown including emails for founder
    const total = signups.length;
    const icpMatched = signups.filter((s) => s.isIcpMatch).length;

    const roleCounts: Record<string, number> = {};
    for (const s of signups) {
      if (s.role) roleCounts[s.role] = (roleCounts[s.role] ?? 0) + 1;
    }

    return {
      total,
      icpMatched,
      outsideIcp: total - icpMatched,
      icpMatchPct: total > 0 ? Math.round((icpMatched / total) * 100) : 0,
      roleCounts,
      // Return top 20 signups sorted by ICP score for outreach
      topSignups: signups
        .sort((a, b) => (b.icpMatchScore ?? 0) - (a.icpMatchScore ?? 0))
        .slice(0, 20)
        .map((s) => ({
          email: s.email,
          role: s.role,
          problem: s.problem,
          icpScore: s.icpMatchScore ?? 0,
          joinedAt: s.joinedAt,
          referralCount: s.referralCount,
        })),
    };
  },
});

// ─── CHECK IF USER IS ON WAITLIST ───────────────────────────────
export const getMyWaitlistPosition = query({
  args: { storyId: v.id("stories"), email: v.string() },
  handler: async (ctx, args) => {
    if (!args.email) return null;
    const signup = await ctx.db
      .query("waitlist_signups")
      .withIndex("by_email_story", (q) =>
        q.eq("email", args.email).eq("storyId", args.storyId)
      )
      .first();
    if (!signup) return null;
    const total = (await ctx.db.get(args.storyId))?.waitlistCount ?? 0;
    return {
      position: signup.queuePosition,
      total,
      referralCode: signup.referralCode,
      referralCount: signup.referralCount,
      icpScore: signup.icpMatchScore ?? 0,
    };
  },
});

// ─── INTERNAL QUERY: Get waitlist signups for a story (for email notifications) ───
export const getWaitlistSignupsForStory = internalQuery({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const signups = await ctx.db
      .query("waitlist_signups")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect();
    return signups;
  },
});

// ─── INTERNAL MUTATION: Mark waitlist signup as notified ───
export const markWaitlistNotified = internalMutation({
  args: { signupId: v.id("waitlist_signups") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.signupId, {
      notifiedAt: Date.now(),
    });
  },
});
