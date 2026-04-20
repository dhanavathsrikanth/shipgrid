"use node"; // Required for using 'crypto'

import { v } from "convex/values";
import { Webhook } from "svix";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Type for the Clerk user object within the webhook payload
// Add all fields you expect to use from the Clerk User object
// See: https://clerk.com/docs/reference/backend-api#tag/Users/operation/GetUser
const clerkUserPayload = v.object({
  id: v.string(), // Clerk User ID
  first_name: v.optional(v.union(v.string(), v.null())),
  last_name: v.optional(v.union(v.string(), v.null())),
  image_url: v.optional(v.union(v.string(), v.null())),
  email_addresses: v.array(v.any()),
  primary_email_address_id: v.optional(v.union(v.string(), v.null())),
  public_metadata: v.optional(v.any()), // Using v.any() for flexibility, or define a stricter object
  username: v.optional(v.union(v.string(), v.null())),
  // Add other fields like 'created_at', 'updated_at' as needed
});

// Type for the overall webhook event payload from Clerk
const clerkWebhookEvent = v.object({
  data: clerkUserPayload, // For user.* events, data is the user object
  object: v.literal("event"),
  type: v.string(), // e.g., "user.created", "user.updated"
  // Add 'instance_id' and 'timestamp' if needed from the outer Svix envelope, though svix library handles envelope.
});

export const handleClerkWebhook = internalAction({
  args: {
    headers: v.object({
      svix_id: v.string(),
      svix_timestamp: v.string(),
      svix_signature: v.string(),
    }),
    payload: v.string(), // Raw payload string for verification
  },
  handler: async (ctx, { headers, payload }) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("CLERK_WEBHOOK_SECRET environment variable not set.");
      throw new Error("Webhook Error: Server configuration missing for webhook secret.");
    }

    const wh = new Webhook(webhookSecret);
    let event: { type: string; data: any; object: "event" } | undefined = undefined;

    // Construct the headers object in the format Svix expects
    const svixCompatibleHeaders = {
      "svix-id": headers.svix_id,
      "svix-timestamp": headers.svix_timestamp,
      "svix-signature": headers.svix_signature,
    };

    try {
      // Verify the webhook signature and parse the payload
      // The `wh.verify` function will throw an error if verification fails
      event = wh.verify(payload, svixCompatibleHeaders) as any; // Use the reconstructed headers
    } catch (err: any) {
      console.error("Svix webhook verification failed:", err.message);
      throw new Error(`Webhook Error: Signature verification failed: ${err.message}`);
    }

    if (!event || !event.data || typeof event.type !== "string") {
      console.error("Malformed webhook event structure:", event);
      throw new Error("Webhook Error: Malformed event structure.");
    }

    // Handle different event types
    switch (event.type) {
      case "user.created":
      case "user.updated":
        console.log(`Received Clerk webhook: ${event.type}`, event.data.id);
        const userData = event.data; // This is the Clerk User object

        // Extract primary email - log raw data for debugging
        const emails = (userData.email_addresses || []) as any[];
        console.log(`Email extraction debug - count: ${emails.length}, primary_id: ${userData.primary_email_address_id}, first_item_keys: ${emails[0] ? Object.keys(emails[0]).join(",") : "none"}, first_email_address: ${emails[0]?.email_address}`);

        let primaryEmail: string | undefined = emails.find(
          (e: any) => e.id === userData.primary_email_address_id
        )?.email_address;

        if (!primaryEmail && emails.length > 0) {
          // fallback: try first item
          primaryEmail = emails[0]?.email_address;
        }

        // Sanitize: strip surrounding quotes or literal "undefined" string
        if (typeof primaryEmail === "string") {
          primaryEmail = primaryEmail.trim().replace(/^"|"$/g, "") || undefined;
          if (primaryEmail === "undefined") primaryEmail = undefined;
        }

        console.log(`Final primaryEmail value: "${primaryEmail}" (type: ${typeof primaryEmail})`);

        if (!primaryEmail) {
          console.error(`No email found for user ${userData.id}. email_addresses count: ${emails.length}, primary_email_address_id: ${userData.primary_email_address_id}, raw emails: ${JSON.stringify(emails)}`);
        }

        console.log(`Syncing user ${userData.id} with email: ${primaryEmail}`);

        await ctx.runMutation(internal.users.syncUserFromClerkWebhook, {
          clerkId: userData.id,
          email: primaryEmail,
          firstName: userData.first_name,
          lastName: userData.last_name,
          imageUrl: userData.image_url,
          username: userData.username,
          publicMetadata: userData.public_metadata,
        });
        break;
      case "user.deleted":
        console.log("User deleted event:", event.data.id);
        if (event.data.id) {
          await ctx.runMutation(internal.users.deleteUserByClerkId, { clerkId: event.data.id });
        }
        break;
      default:
        console.log(`Received unhandled Clerk webhook event: ${event.type}`);
    }

    return { success: true };
  },
});
