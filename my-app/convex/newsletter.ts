import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./utils";

/**
 * Subscribes an email to the newsletter.
 * Works for both authenticated and guest users.
 */
export const subscribe = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email address.");
    }

    // Check if already subscribed
    const existing = await ctx.db
      .query("newsletterSubscriptions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) {
      return { success: false, message: "This email is already subscribed!" };
    }

    // Optional: Link to logged-in user
    let userId = undefined;
    try {
      const { user } = await requireAuth(ctx);
      if (user) {
        userId = user._id;
      }
    } catch (e) {
      // Ignore auth errors for guest subscriptions
    }

    await ctx.db.insert("newsletterSubscriptions", {
      email,
      subscribedAt: Date.now(),
      userId,
    });

    return { success: true, message: "Successfully subscribed!" };
  },
});

/**
 * Checks if the current user or a specific email is subscribed.
 */
export const checkSubscription = query({
  args: {
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let emailToCheck = args.email?.toLowerCase().trim();

    if (!emailToCheck) {
      try {
        const { user } = await requireAuth(ctx);
        if (user && user.email) {
          emailToCheck = user.email.toLowerCase();
        }
      } catch (e) {
        return false;
      }
    }

    if (!emailToCheck) return false;

    const existing = await ctx.db
      .query("newsletterSubscriptions")
      .withIndex("by_email", (q) => q.eq("email", emailToCheck))
      .unique();

    return !!existing;
  },
});
