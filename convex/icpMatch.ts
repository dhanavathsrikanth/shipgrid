import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

export const getMatchedStories = action({
  args: {},
  handler: async (ctx, args): Promise<any[]> => {
    console.log("getMatchedStories (Simplified) called successfully");
    return [];
  },
});
