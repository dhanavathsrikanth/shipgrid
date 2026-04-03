import { query } from "./_generated/server";

export const listLastUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").order("desc").take(5);
    return users;
  },
});
