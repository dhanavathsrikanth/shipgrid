import { internalAction, internalMutation, internalQuery, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Run this on a schedule — finds verdict_requests where:
// - bookmarkedAt was 7 days ago
// - emailSentAt is null (not yet sent)
export const processVerdictRequests = internalAction({
  handler: async (ctx) => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Get pending requests where bookmark was 7+ days ago
    const pending = await ctx.runQuery(
      internal.verdictLoop.getPendingVerdictRequests,
      { olderThan: sevenDaysAgo }
    );

    for (const request of pending) {
      // Get user email
      const user = await ctx.runQuery(internal.verdictLoop.getUserById, {
        userId: request.userId,
      });
      if (!user?.email) continue;

      // Get product name
      const story = await ctx.runQuery(internal.verdictLoop.getStoryById, {
        storyId: request.storyId,
      });
      if (!story) continue;

      // Generate unsubscribe token
      const unsubscribeToken = await ctx.runMutation(
        internal.emails.linkHelpers.generateUnsubscribeToken,
        {
          userId: request.userId,
          purpose: "all",
        }
      );

      // Build verdict email HTML with three action buttons
      const siteUrl = process.env.SITE_URL || "https://goshipgrid.app";
      const verdictUsingUrl = `${siteUrl}/verdict?r=${request._id}&v=still_using`;
      const verdictDroppedUrl = `${siteUrl}/verdict?r=${request._id}&v=dropped`;
      const verdictNeverUrl = `${siteUrl}/verdict?r=${request._id}&v=never_activated`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Did ${story.title} solve your problem?</h2>
          <p style="color: #666; line-height: 1.6;">
            You bookmarked ${story.title} 7 days ago. We'd love to know if it worked for you.
          </p>
          <div style="margin: 30px 0;">
            <a href="${verdictUsingUrl}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-right: 10px; margin-bottom: 10px;">
              ✅ Still using it
            </a>
            <a href="${verdictDroppedUrl}" style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin-right: 10px; margin-bottom: 10px;">
              ⚠️ Tried and dropped
            </a>
            <a href="${verdictNeverUrl}" style="display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin-bottom: 10px;">
              ❌ Never activated
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">
            Your feedback helps founders improve their products.
          </p>
          <p style="color: #999; font-size: 12px;">
            <a href="${siteUrl}/api/unsubscribe?token=${unsubscribeToken}">Unsubscribe</a>
          </p>
        </div>
      `;

      // Send verdict email using Resend
      await ctx.runAction(internal.emails.resend.sendEmail, {
        to: user.email,
        subject: `Did ${story.title} solve your problem?`,
        html,
        emailType: "changelog_update", // Reuse existing type or add new
        userId: request.userId,
        unsubscribeToken,
      });

      // Mark as sent
      await ctx.runMutation(internal.verdictLoop.markVerdictEmailSent, {
        requestId: request._id,
      });
    }
  },
});

export const getPendingVerdictRequests = internalQuery({
  args: { olderThan: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("verdict_requests")
      .withIndex("by_send_window", (q) => q.eq("emailSentAt", undefined))
      .filter((q) => q.lte(q.field("bookmarkedAt"), args.olderThan))
      .take(50); // Process 50 at a time
  },
});

export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => ctx.db.get(args.userId),
});

export const getStoryById = internalQuery({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => ctx.db.get(args.storyId),
});

export const markVerdictEmailSent = internalMutation({
  args: { requestId: v.id("verdict_requests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, { emailSentAt: Date.now() });
  },
});

// Called when user clicks a verdict link in their email
export const recordVerdict = mutation({
  args: {
    requestId: v.id("verdict_requests"),
    verdict: v.string(), // "still_using" | "dropped" | "never_activated"
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Verdict request not found");

    await ctx.db.patch(args.requestId, {
      verdict: args.verdict,
      responseAt: Date.now(),
    });
  },
});
