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
  let hasMore = true;
  let offset = 0;

  console.log("[Bulk Sync] Starting full Clerk-to-Convex synchronization...");

  while (hasMore) {
    try {
      const url = new URL("https://api.clerk.com/v1/users");
      url.searchParams.set("limit", "100");
      url.searchParams.set("order_by", "+created_at");
      url.searchParams.set("offset", offset.toString());

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(`[Bulk Sync] Clerk API failed: ${response.statusText}`);
        break;
      }

      const clerkUsers = await response.json();
      if (!clerkUsers || clerkUsers.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`[Bulk Sync] Processing batch of ${clerkUsers.length} users at offset ${offset}...`);

      // Process each user in the batch
      for (const clerkUser of clerkUsers) {
        let primaryEmail: string | undefined = undefined;
        if (clerkUser.primary_email_address_id && clerkUser.email_addresses) {
          const foundEmail = clerkUser.email_addresses.find(
            (ea: any) => ea.id === clerkUser.primary_email_address_id
          );
          if (foundEmail) {
            primaryEmail = foundEmail.email_address;
          }
        }
        if (!primaryEmail && clerkUser.email_addresses?.[0]) {
          primaryEmail = clerkUser.email_addresses[0].email_address;
        }

        // Trigger the internal mutation to sync this user
        try {
          await ctx.runMutation(internal.users.syncUserFromClerkWebhook, {
            clerkId: clerkUser.id,
            email: primaryEmail,
            firstName: clerkUser.first_name,
            lastName: clerkUser.last_name,
            imageUrl: clerkUser.image_url,
            username: clerkUser.username,
            publicMetadata: clerkUser.public_metadata,
          });
          totalSynced++;
        } catch (syncErr) {
          console.error(`[Bulk Sync] Failed to sync individual user ${clerkUser.id}:`, syncErr);
        }
      }

      offset += clerkUsers.length;
      
      if (clerkUsers.length < 100) {
        hasMore = false;
      } else {
        // Brief pause between pages to be nice to the API
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error(`[Bulk Sync] Fatal error during sync loop:`, error);
      hasMore = false;
    }
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
    await requireAdminRole(ctx);
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


