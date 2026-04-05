import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAdminRole } from "../users";

/**
 * Update a global application setting.
 */
export const adminUpdateAppSettings = mutation({
  args: {
    key: v.string(),
    valueBoolean: v.optional(v.boolean()),
    valueString: v.optional(v.string()),
    valueNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdminRole(ctx);
    
    const existing = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
      
    if (existing) {
      await ctx.db.patch(existing._id, {
        valueBoolean: args.valueBoolean,
        valueString: args.valueString,
        valueNumber: args.valueNumber,
      });
    } else {
      await ctx.db.insert("appSettings", {
        key: args.key,
        valueBoolean: args.valueBoolean,
        valueString: args.valueString,
        valueNumber: args.valueNumber,
      });
    }
  },
});

/**
 * Get all app settings.
 */
export const adminGetAllSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdminRole(ctx);
    return await ctx.db.query("appSettings").collect();
  },
});
