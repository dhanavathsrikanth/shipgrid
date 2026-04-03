import { action, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireAdminRole } from "./users";

/**
 * Public action to sync a specific user's email.
 * Users can sync their own data, or admins can sync any user.
 */
export const syncUserEmail = action({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Allow if the user is syncing their own Clerk ID, or if they are an admin
    if (identity.subject !== args.clerkId) {
      await requireAdminRole(ctx);
    }

    await ctx.runAction(internal.clerkSync.syncUserEmailByClerkId, {
      clerkId: args.clerkId,
    });
    return { success: true };
  },
});

/**
 * Public action to sync all missing emails.
 */
export const syncAllMissing = action({
  args: {},
  handler: async (ctx) => {
    await requireAdminRole(ctx);
    await ctx.runAction(internal.clerkSync.syncAllMissingEmails);
    return { success: true };
  },
});

/**
 * Syncs a single user's email from Clerk if it's missing or different in Convex.
 */
export const syncUserEmailByClerkId = internalAction({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      console.warn("CLERK_SECRET_KEY not set, skipping sync");
      return;
    }

    try {
      const response = await fetch(`https://api.clerk.com/v1/users/${args.clerkId}`, {
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch user ${args.clerkId} from Clerk: ${response.statusText}`);
        return;
      }

      const userData = await response.json();
      const primaryEmail = userData.email_addresses.find(
        (e: any) => e.id === userData.primary_email_address_id
      )?.email_address;

      if (primaryEmail) {
        // Find user in Convex
        const user = await ctx.runQuery(internal.users.getUserByClerkIdInternal, {
          clerkId: args.clerkId
        });

        if (user) {
          await ctx.runMutation(internal.users.updateEmailInternal, {
            userId: user._id,
            email: primaryEmail,
          });
        }
      }
    } catch (error) {
      console.error(`Error syncing user email for ${args.clerkId}:`, error);
    }
  },
});

/**
 * Scans all users missing an email and attempts to sync them from Clerk.
 */
export const syncAllMissingEmails = internalAction({
  args: {},
  handler: async (ctx) => {
    const usersMissingEmail = await ctx.runQuery(internal.users.getUsersMissingEmailInternal);

    console.log(`Found ${usersMissingEmail.length} users missing emails.`);

    // Process in small batches
    const BATCH_SIZE = 5;
    for (let i = 0; i < usersMissingEmail.length; i += BATCH_SIZE) {
      const batch = usersMissingEmail.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map((user) =>
          ctx.runAction(internal.clerkSync.syncUserEmailByClerkId, {
            clerkId: user.clerkId
          })
        )
      );

      if (i + BATCH_SIZE < usersMissingEmail.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  },
});
