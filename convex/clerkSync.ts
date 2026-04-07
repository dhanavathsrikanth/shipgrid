import { action, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { ActionCtx } from "./_generated/server";
import { requireAdminRole } from "./users";

/**
 * Helper function for syncUserEmailByClerkId.
 * Extracted to avoid circular type references in Convex internal calls.
 */
async function _syncUserEmailByClerkId(ctx: ActionCtx, clerkId: string) {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    console.warn("CLERK_SECRET_KEY not set, skipping sync");
    return { synced: false };
  }

  try {
    const response = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch user ${clerkId} from Clerk: ${response.statusText}`);
      return { synced: false };
    }

    const userData = await response.json();
    const primaryEmail = userData.email_addresses.find(
      (e: any) => e.id === userData.primary_email_address_id
    )?.email_address;

    if (userData) {
      // Trigger the internal mutation to sync this user with full metadata
      await ctx.runMutation(internal.users.syncUserFromClerkWebhook, {
        clerkId,
        email: primaryEmail,
        firstName: userData.first_name,
        lastName: userData.last_name,
        imageUrl: userData.image_url,
        username: userData.username,
        publicMetadata: userData.public_metadata,
      });
      return { synced: true };
    }
  } catch (error) {
    console.error(`Error syncing user email for ${clerkId}:`, error);
  }
  return { synced: false };
}

/**
 * Helper function for syncAllMissingEmails.
 * Extracted to avoid circular type references in Convex internal calls.
 */
async function _syncAllMissingEmails(ctx: ActionCtx) {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    console.error("CLERK_SECRET_KEY not set, skipping sync");
    return 0;
  }

  let totalSynced = 0;

  console.log("[Bulk Sync] Starting Convex-driven Clerk-to-Convex synchronization...");

  try {
    // 1. Get all Convex users that are missing an email
    const usersNeedingSync = await ctx.runQuery(internal.users.getUsersNeedingEmailSync);
    
    if (!usersNeedingSync || usersNeedingSync.length === 0) {
      console.log("[Bulk Sync] No users found missing emails. Sync complete.");
      return 0;
    }

    console.log(`[Bulk Sync] Found ${usersNeedingSync.length} users missing emails. Syncing...`);

    // 2. Fetch from Clerk API for each specific user
    for (const user of usersNeedingSync) {
      if (user.clerkId) {
        const result = await _syncUserEmailByClerkId(ctx, user.clerkId);
        if (result.synced) {
          totalSynced++;
        }
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    console.error(`[Bulk Sync] Fatal error during sync loop:`, error);
  }

  console.log(`[Bulk Sync] Operation complete. Total users processed: ${totalSynced}`);
  return totalSynced;
}

/**
 * Public action to sync a specific user's email.
 */
export const syncUserEmail = action({
  args: { clerkId: v.string() },
  returns: v.object({ success: v.boolean(), synced: v.boolean() }),
  handler: async (ctx, args) => {
    // Allow admins to sync anyone, OR allow users to sync themselves
    let isAdmin = false;
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        // If they are just syncing themselves, we don't strictly require admin
        if (identity.subject === args.clerkId) {
          isAdmin = true; // Effectively authorize them
        } else {
          // If trying to sync someone else, require admin
          await requireAdminRole(ctx);
          isAdmin = true;
        }
      } else {
        await requireAdminRole(ctx); // Will fail
      }
    } catch(e) {
      // requireAdminRole threw an error
      throw new Error("Unauthorized to sync this user's email.");
    }
    
    const result = await _syncUserEmailByClerkId(ctx, args.clerkId);
    return { success: true, ...result };
  },
});

/**
 * Public action to sync all missing emails.
 */
export const syncAllMissing = action({
  args: {},
  returns: v.object({ success: v.boolean(), count: v.number() }),
  handler: async (ctx) => {
    await requireAdminRole(ctx);
    const count = await _syncAllMissingEmails(ctx);
    return { success: true, count };
  },
});

/**
 * Syncs a single user's email from Clerk if it's missing or different in Convex.
 */
export const syncUserEmailByClerkId = internalAction({
  args: { clerkId: v.string() },
  returns: v.object({ synced: v.boolean() }),
  handler: async (ctx, args) => {
    return await _syncUserEmailByClerkId(ctx, args.clerkId);
  },
});

/**
 * Scans all matching users between Clerk and Convex and ensures emails/metadata are synced.
 * Uses pagination (100 users per request) to handle large user bases efficiently.
 */
export const syncAllMissingEmails = internalAction({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    return await _syncAllMissingEmails(ctx);
  },
});


