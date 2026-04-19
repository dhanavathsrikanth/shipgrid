"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Phase 5.6 — 30-Day Follow-Up Email Cron
 *
 * Runs daily. Finds stories that were approved approximately 30 days ago
 * (between 29.5 and 30.5 days) and emails the builder asking for a product
 * update (traction, changelog, next milestone).
 *
 * Deduplication: checks emailLogs for "follow_up_30day" per story to avoid
 * resending if the cron overlaps on an edge day.
 */
export const sendFollowUpEmails = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Find stories approved ~30 days ago
    const stories = await ctx.runQuery(
      internal.emails.followUpHelpers.getStoriesDue30DayFollowUp,
      {},
    );

    console.log(`[30-day follow-up] Found ${stories.length} stories due for follow-up`);

    let sent = 0;
    let skipped = 0;

    for (const story of stories) {
      if (!story.userId) {
        skipped++;
        continue;
      }

      // Get builder's email
      const user = await ctx.runQuery(internal.emails.queries.getUserWithEmail, {
        userId: story.userId,
      });

      if (!user || !user.email) {
        skipped++;
        continue;
      }

      // Dedup: only one follow-up ever per story
      const alreadySent = await ctx.runQuery(
        internal.emails.followUpHelpers.hasReceivedFollowUp,
        { storyId: story._id },
      );

      if (alreadySent) {
        skipped++;
        continue;
      }

      // Generate unsubscribe token
      const unsubscribeToken = await ctx.runMutation(
        internal.emails.linkHelpers.generateUnsubscribeToken,
        { userId: story.userId, purpose: "marketing" },
      );

      // Build email HTML
      const html = buildFollowUpHtml({
        builderName: user.name || "Maker",
        productTitle: story.title,
        productSlug: story.slug,
        voteCount: story.votes ?? 0,
        commentCount: story.commentCount ?? 0,
        unsubscribeToken,
      });

      // Send via Resend
      await ctx.runAction(internal.emails.resend.sendEmail, {
        to: user.email,
        subject: `How's ${story.title} doing? Share an update 🚀`,
        html,
        emailType: "follow_up_30day",
        userId: story.userId,
        unsubscribeToken,
        metadata: { storyId: story._id, storySlug: story.slug },
      });

      // Log this follow-up so we never resend for the same story
      await ctx.runMutation(internal.emails.followUpHelpers.markFollowUpSent, {
        storyId: story._id,
        userId: story.userId,
      });

      sent++;
    }

    console.log(
      `[30-day follow-up] Done. Sent: ${sent}, Skipped: ${skipped}`,
    );
    return null;
  },
});

// ── HTML template ─────────────────────────────────────────────────────────────

function buildFollowUpHtml(opts: {
  builderName: string;
  productTitle: string;
  productSlug: string;
  voteCount: number;
  commentCount: number;
  unsubscribeToken: string;
}): string {
  const { builderName, productTitle, productSlug, voteCount, commentCount, unsubscribeToken } = opts;
  const productUrl = `https://goshipgrid.app/s/${productSlug}`;
  const analyticsUrl = `https://goshipgrid.app/s/${productSlug}/analytics`;
  const changelogUrl = `${productUrl}#updates`;
  const unsubscribeUrl = `https://goshipgrid.app/api/unsubscribe?token=${unsubscribeToken}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>30-Day Check-In: ${productTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:28px;">🚀</p>
              <h1 style="margin:12px 0 4px;color:#ffffff;font-size:22px;font-weight:700;">30-Day Check-In</h1>
              <p style="margin:0;color:#e0e7ff;font-size:14px;">How is ${productTitle} doing?</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6;">
                Hey <strong>${builderName}</strong> 👋,
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#6b7280;line-height:1.6;">
                It's been 30 days since you launched <strong style="color:#1f2937;">${productTitle}</strong> on ShipGrid. 
                We'd love to hear how things are going!
              </p>

              <!-- Stats row -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#f3f4f6;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 24px;text-align:center;border-right:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:28px;font-weight:700;color:#6366f1;">${voteCount}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Vibes</p>
                  </td>
                  <td style="padding:16px 24px;text-align:center;">
                    <p style="margin:0;font-size:28px;font-weight:700;color:#6366f1;">${commentCount}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Comments</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Sharing a quick update — a new feature, a milestone, user feedback you received — 
                is one of the best ways to <strong style="color:#1f2937;">bring your audience back</strong> and 
                keep the momentum going.
              </p>

              <!-- CTA Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 8px 0 0;" width="50%">
                    <a href="${changelogUrl}" style="display:block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:8px;font-size:14px;font-weight:600;text-align:center;">
                      📝 Post an Update
                    </a>
                  </td>
                  <td style="padding:0 0 0 8px;" width="50%">
                    <a href="${analyticsUrl}" style="display:block;background:#f3f4f6;color:#374151;text-decoration:none;padding:14px 20px;border-radius:8px;font-size:14px;font-weight:600;text-align:center;border:1px solid #e5e7eb;">
                      📊 View Analytics
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Tips -->
              <div style="margin-top:32px;padding:20px;background:#eff6ff;border-radius:8px;border-left:4px solid #6366f1;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1e40af;">💡 Quick update ideas:</p>
                <ul style="margin:0;padding-left:18px;font-size:13px;color:#3b82f6;line-height:1.8;">
                  <li>Share early traction — signups, revenue, users</li>
                  <li>Announce a new feature you shipped</li>
                  <li>Post user feedback or a testimonial</li>
                  <li>Share your next milestone or roadmap</li>
                </ul>
              </div>

              <p style="margin:24px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
                Keep building. We're rooting for you. 🙌<br/>
                — The ShipGrid Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                You're receiving this because you launched a product on <a href="https://goshipgrid.app" style="color:#6366f1;text-decoration:none;">ShipGrid</a>.
                <br/>
                <a href="${productUrl}" style="color:#6366f1;text-decoration:none;">${productTitle}</a>
                &nbsp;·&nbsp;
                <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:none;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
