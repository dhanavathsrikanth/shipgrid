import { internalAction, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

export const notifyBetaLaunch = internalAction({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    // 1. Check deduplication log
    const alreadySent = await ctx.runQuery(internal.emails.lifecycleQueries.hasSentNotification, {
      storyId: args.storyId,
      type: "beta_launch",
    });
    
    if (alreadySent) {
      console.log("Beta notification already sent for this story");
      return;
    }

    // 2. Fetch story
    const story = await ctx.runQuery(internal.stories.getStoryByIdInternal, {
      storyId: args.storyId,
    });
    
    if (!story) throw new Error("Story not found");

    // 3. Mark as sent
    await ctx.runMutation(internal.emails.lifecycleQueries.logNotification, {
      storyId: args.storyId,
      type: "beta_launch",
    });

    // 4. Fetch all followers
    const followers = await ctx.runQuery(internal.emails.lifecycleQueries.getProductFollowers, {
      storyId: args.storyId,
    });

    for (const followerId of followers) {
      const user = await ctx.runQuery(internal.emails.queries.getUserWithEmail, { userId: followerId });
      if (!user || !user.email) continue;
      
      const unsubscribeToken = await ctx.runMutation(internal.emails.linkHelpers.generateUnsubscribeToken, {
        userId: followerId,
        purpose: "all",
      });

      const emailTemplate = await ctx.runQuery(internal.emails.lifecycleTemplates.generateBetaLaunchEmail, {
        productName: story.title,
        tagline: story.description,
        icpRoles: story.icpRoles,
        productUrl: story.url,
        trovaUrl: `https://vibeapps.dev/s/${story.slug || story._id}`,
        unsubscribeToken,
      });

      await ctx.runAction(internal.emails.resend.sendEmail, {
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        emailType: "beta_launch",
        userId: followerId,
        unsubscribeToken,
      });
    }
  }
});

export const notifyChangelogUpdate = internalAction({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    // Determine recent changelog entry
    const story = await ctx.runQuery(internal.stories.getStoryByIdInternal, {
      storyId: args.storyId,
    });
    if (!story) return;

    let changelogTitle = "New Update";
    let changelogExcerpt = "The founder just posted a new update.";
    
    if (story.changeLog && story.changeLog.length > 0) {
      const latest = story.changeLog[story.changeLog.length - 1];
      if (latest.textChanges && latest.textChanges.length > 0) {
        changelogTitle = `Updated ${latest.textChanges[0].field}`;
        changelogExcerpt = latest.textChanges[0].newValue;
      }
    }

    // Since a founder might post multiple changelogs, we might still want deduplication or rate limits
    // but the spec dictates: "Every time the founder posts a changelog... emails are sent."
    // 1. Fetch followers
    const followers = await ctx.runQuery(internal.emails.lifecycleQueries.getProductFollowers, {
      storyId: args.storyId,
    });

    for (const followerId of followers) {
      const user = await ctx.runQuery(internal.emails.queries.getUserWithEmail, { userId: followerId });
      if (!user || !user.email) continue;
      
      const unsubscribeToken = await ctx.runMutation(internal.emails.linkHelpers.generateUnsubscribeToken, {
        userId: followerId,
        purpose: "all",
      });

      const emailTemplate = await ctx.runQuery(internal.emails.lifecycleTemplates.generateChangelogEmail, {
        productName: story.title,
        changelogTitle,
        changelogContentExcerpt: changelogExcerpt,
        trovaUrl: `https://vibeapps.dev/s/${story.slug || story._id}`,
        unsubscribeToken,
      });

      await ctx.runAction(internal.emails.resend.sendEmail, {
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        emailType: "changelog_update",
        userId: followerId,
        unsubscribeToken,
      });
    }
  }
});
