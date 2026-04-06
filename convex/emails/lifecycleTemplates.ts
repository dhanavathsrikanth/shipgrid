import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Generate beta launch email notification content
 */
export const generateBetaLaunchEmail = internalQuery({
  args: {
    productName: v.string(),
    tagline: v.string(),
    icpRoles: v.optional(v.array(v.string())),
    productUrl: v.string(),
    trovaUrl: v.string(),
    unsubscribeToken: v.optional(v.string()),
  },
  returns: v.object({
    subject: v.string(),
    html: v.string(),
  }),
  handler: async (ctx, args) => {
    const subject = `${args.productName} just launched beta — 72 hours open`;
    const builtForText = args.icpRoles && args.icpRoles.length > 0
      ? `Built for: ${args.icpRoles.join(", ")}`
      : "";

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <p><strong>${args.productName} is now in beta.</strong></p>
            
            <p>${args.tagline}</p>
            
            ${builtForText ? `<p>${builtForText}</p>` : ""}
            
            <p>72 hours remaining.</p>

            <p>
              <a href="${args.productUrl}" style="color: #292929; text-decoration: none; font-weight: bold;">Try it now →</a><br>
              <a href="${args.trovaUrl}" style="color: #666; text-decoration: none;">View on Trova →</a>
            </p>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
              <p>You're receiving this because you followed ${args.productName} on Trova.</p>
              ${args.unsubscribeToken ? `<p><a href="https://goshipgrid.app/api/unsubscribe?token=${args.unsubscribeToken}" style="color: #666;">Unsubscribe</a></p>` : ""}
            </div>
          </div>
        </body>
      </html>
    `;

    return { subject, html };
  },
});

/**
 * Generate changelog update email notification content
 */
export const generateChangelogEmail = internalQuery({
  args: {
    productName: v.string(),
    changelogTitle: v.string(),
    changelogContentExcerpt: v.string(),
    trovaUrl: v.string(),
    unsubscribeToken: v.optional(v.string()),
  },
  returns: v.object({
    subject: v.string(),
    html: v.string(),
  }),
  handler: async (ctx, args) => {
    const subject = `${args.productName} posted an update`;

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <p><strong>${args.productName} — ${args.changelogTitle}</strong></p>
            
            <p>${args.changelogContentExcerpt}</p>

            <p>
              <a href="${args.trovaUrl}" style="color: #292929; text-decoration: none; font-weight: bold;">Read the full update →</a>
            </p>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
              <p>You're receiving this because you followed ${args.productName} on Trova.</p>
              ${args.unsubscribeToken ? `<p><a href="https://goshipgrid.app/api/unsubscribe?token=${args.unsubscribeToken}" style="color: #666;">Unsubscribe</a></p>` : ""}
            </div>
          </div>
        </body>
      </html>
    `;

    return { subject, html };
  },
});
