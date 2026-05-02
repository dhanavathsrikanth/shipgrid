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
        trovaUrl: `https://goshipgrid.app/s/${story.slug || story._id}`,
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
        trovaUrl: `https://goshipgrid.app/s/${story.slug || story._id}`,
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

export const notifyWaitlistBetaLaunch = internalAction({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    // 1. Fetch story
    const story = await ctx.runQuery(internal.stories.getStoryByIdInternal, {
      storyId: args.storyId,
    });
    
    if (!story) throw new Error("Story not found");

    // 2. Fetch all waitlist signups for this story
    const signups = await ctx.runQuery(internal.waitlist.getWaitlistSignupsForStory, {
      storyId: args.storyId,
    });

    if (!signups || signups.length === 0) {
      console.log("No waitlist signups for this story");
      return;
    }

    // 3. Prioritize ICP-matched users
    const matchedSignups = signups.filter((s) => s.isIcpMatch);
    const unmatchedSignups = signups.filter((s) => !s.isIcpMatch);
    const prioritizedSignups = [...matchedSignups, ...unmatchedSignups];

    // 4. Send emails to each signup
    for (const signup of prioritizedSignups) {
      // Skip if already notified
      if (signup.notifiedAt) continue;

      const role = signup.role || "user";
      const problem = signup.problem || "your problem";
      
      const emailSubject = `${story.title} is now in beta — you're on the waitlist`;
      
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">${story.title} is now in beta!</h2>
          <p style="color: #666; line-height: 1.6;">
            You joined the waitlist as a <strong>${role}</strong> solving <strong>${problem}</strong>.
            ${story.title} was built for exactly that.
          </p>
          <p style="color: #666; line-height: 1.6;">
            ${story.description}
          </p>
          <div style="margin: 30px 0;">
            <a href="${story.url || `https://goshipgrid.app/s/${story.slug || story._id}`}" 
               style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Try ${story.title} now
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">
            You're receiving this because you joined the waitlist for ${story.title}.
          </p>
        </div>
      `;

      await ctx.runAction(internal.emails.resend.sendEmail, {
        to: signup.email,
        subject: emailSubject,
        html: emailBody,
        emailType: "waitlist_beta_launch",
        userId: undefined, // Waitlist signups may not have user accounts
        unsubscribeToken: undefined, // No unsubscribe for waitlist emails
      });

      // 5. Update notifiedAt
      await ctx.runMutation(internal.waitlist.markWaitlistNotified, {
        signupId: signup._id,
      });
    }
  }
});
