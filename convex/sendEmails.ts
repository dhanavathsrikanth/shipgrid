import { components, internal } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import {
  internalMutation,
  internalAction,
  mutation,
} from "./_generated/server";
import { v } from "convex/values";
import { requireAdminRole } from "./users";

export const resend: Resend = new Resend(components.resend, {
  onEmailEvent: internal.sendEmails.handleEmailEvent,
  testMode: false, // Disable test mode to send to real email addresses
});

// Public mutation for admins to send test emails
export const sendTestEmail = mutation({
  args: {
    to: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    await requireAdminRole(ctx);

    try {
      const from = `${process.env.EMAIL_FROM_NAME || "ShipGrid Updates"} <${process.env.EMAIL_FROM_ADDRESS || "alerts@updates.goshipgrid.app"}>`;
      const result = await resend.sendEmail(ctx, {
        from,
        to: args.to,
        subject: withSubjectPrefix("Test email from admin"),
        html: `
          <h2>Test Email Success!</h2>
          <p>This test email was sent from the ShipGrid admin dashboard.</p>
          <p><strong>Sent to:</strong> ${args.to}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p>If you received this, your email system is working perfectly! 🎉</p>
        `,
      });

      return {
        success: true,
        message: `Test email sent successfully to ${args.to}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send test email: ${error}`,
      };
    }
  },
});

// Internal mutation for testing; enforces subject prefix and from address.
export const sendTestEmailInternal = internalMutation({
  args: {
    to: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const from = `${process.env.EMAIL_FROM_NAME || "ShipGrid Updates"} <${process.env.EMAIL_FROM_ADDRESS || "alerts@updates.goshipgrid.app"}>`;
      const result = await resend.sendEmail(ctx, {
        from,
        to: args.to || "wayne@convex.dev", // Default to your email
        subject: withSubjectPrefix("Test email from admin"),
        html: `
          <h2>Test Email Success!</h2>
          <p>This test email was sent from the ShipGrid admin dashboard.</p>
          <p><strong>Sent to:</strong> ${args.to || "wayne@convex.dev"}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p>If you received this, your email system is working perfectly! 🎉</p>
        `,
      });

      return {
        success: true,
        message: `Test email sent successfully to ${args.to || "wayne@convex.dev"}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send test email: ${error}`,
      };
    }
  },
});

// Internal mutation to handle email events from Resend webhooks
export const handleEmailEvent = internalMutation({
  args: {
    id: v.string(),
    event: v.any(),
  },
  handler: async (ctx, args) => {
    const eventType = args.event.type.replace("email.", "");
    const messageId = args.id;

    if (!messageId) return;

    // Map Resend events to our internal log statuses
    const statusMap: Record<string, "delivered" | "bounced" | "complained"> = {
      delivered: "delivered",
      bounced: "bounced",
      complained: "complained",
    };

    const status = statusMap[eventType];
    if (status) {
      await ctx.runMutation(internal.emails.queries.updateEmailLogStatus, {
        resendMessageId: messageId,
        status,
        metadata: args.event.data,
      });
    }
  },
});

// Internal action to send emails (used by other internal functions)
export const sendEmail = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const from = `${process.env.EMAIL_FROM_NAME || "ShipGrid Updates"} <${process.env.EMAIL_FROM_ADDRESS || "alerts@updates.goshipgrid.app"}>`;
      await resend.sendEmail(ctx, {
        from,
        to: args.to,
        subject: withSubjectPrefix(args.subject),
        html: args.html,
      });

      return {
        success: true,
        message: `Email sent successfully to ${args.to}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send email: ${error}`,
      };
    }
  },
});

// Helper to wrap subjects to always have the required prefix
export function withSubjectPrefix(subject: string): string {
  const prefix = process.env.EMAIL_SUBJECT_PREFIX || "ShipGrid Updates: ";
  return subject.startsWith(prefix) ? subject : `${prefix}${subject}`;
}
