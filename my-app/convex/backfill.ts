import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { ActionCtx } from "./_generated/server";

export const all = internalAction({
  args: {},
  handler: async (ctx: ActionCtx): Promise<{ message: string; storiesCount: number; usersCount: number }> => {
    // 1. Load all approved stories
    const stories = (await ctx.runQuery(internal.stories.getAllApprovedInternal)) as any[];
    console.log(`Scheduling backfill for ${stories.length} stories...`);
    
    for (const story of stories) {
      await ctx.scheduler.runAfter(0, internal.embeddings.generateProductEmbedding, {
        storyId: story._id,
      });
    }

    // 2. Load all users with ICP
    const users = (await ctx.runQuery(internal.users.getAllWithIcpInternal)) as any[];
    console.log(`Scheduling backfill for ${users.length} users...`);

    for (const user of users) {
      await ctx.scheduler.runAfter(0, internal.embeddings.generateUserEmbedding, {
        userId: user._id,
      });
    }

    return { 
      message: "Backfill scheduled successfully",
      storiesCount: stories.length, 
      usersCount: users.length 
    };
  },
});
