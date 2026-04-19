# Shipgrid Improvement Plan
### Beating Product Hunt by Building What They Broke

---

## Executive Summary

Shipgrid is already ahead of Product Hunt in several meaningful ways: ICP semantic matching, a 1–10 rating system (not just upvotes), a full judging/competition engine, DMs, real-time notifications, and a rich admin system. The gap to close is in **discovery fairness**, **comment quality**, **builder analytics**, and **anti-gaming trust signals** — the exact four areas where PH is deteriorating fastest.

This plan is organized into phases with concrete frontend and backend tasks for each. Every item maps to either an existing file you can extend or a new file to create.

---

## Current State Audit

### What's Already Built (Strengths)
- ICP matching with vector embeddings (`icpMatch.ts`, `embeddings.ts`, `IcpBanner`, `MatchedStoriesShelf`)
- 1–10 star ratings with `averageRating` + `ratingCount` on stories
- Full judging/competition system (`judges.ts`, `judgeScores.ts`, `judgingGroups.ts`)
- DM system with rate limiting, reactions, blocking (`dm.ts`, `dmReactions.ts`)
- Comprehensive alert/notification system (`alerts.ts`) with 14 alert types
- Rich email system via Resend with daily engagement, weekly digest, mentions, broadcasts
- Admin dashboard with moderation, reports, user management, SEO, settings
- `productFollows` table for lifecycle notifications
- `changeLog` on stories for edit tracking
- `buildingStatus` concept partially present via story lifecycle fields
- `WeeklyLeaderboard`, `TopCategoriesOfWeek`, `RecentVibers` sidebar widgets
- Tag system with colors, emojis, header visibility

### What's Missing or Incomplete (Gaps)
- `/leaderboard` route exists but likely thin — no transparent scoring formula shown
- `/explore` and `/compare` routes exist but appear empty
- No builder analytics dashboard (engagement data exists in `dailyEngagementSummary` but not surfaced)
- No structured feedback prompts in `CommentForm`
- No comment quality scoring (depth, specificity, maker-response flag)
- No `trendingScore` computed field — ranking is raw votes only
- No `featuredUntil` guaranteed exposure window for new submissions
- No suspicious vote detection
- No "I'm interested" / waitlist capture per product
- No feature request board per product
- No `/s/[slug]/analytics` page for submitters
- No tag-based community feed pages beyond basic tag filtering
- No public `/scoring` transparency page
- No `buildingStatus` field on stories schema (idea → building → beta → live → acquired → sunset)
- Weekly digest email exists but no category-specific digest
- No comment upvoting surfaced in UI (votes field exists on comments but may not be wired)

---

## Phase 1 — Transparent & Fair Discovery
**Goal:** Replace the opaque single-leaderboard model with multi-surface, time-decayed, formula-transparent discovery.
**Timeline:** 2–3 weeks

### Backend Tasks

**1.1 Add `trendingScore` to stories schema**
File: `my-app/convex/schema.ts`
```
trendingScore: v.optional(v.number()),
featuredUntil: v.optional(v.number()),   // timestamp: guaranteed exposure window
buildingStatus: v.optional(v.union(
  v.literal("idea"),
  v.literal("building"),
  v.literal("beta"),
  v.literal("live"),
  v.literal("acquired"),
  v.literal("sunset"),
)),
```

**1.2 Trending score computation cron**
File: `my-app/convex/crons.ts` — add a new cron every hour
New file: `my-app/convex/trending.ts`
```typescript
// Formula: (votes + avgRating*10*ratingCount + commentsCount*3) / (hoursOld + 2)^1.5
// Run as internalMutation, batch update trendingScore on all approved stories
```
This replaces raw vote sorting with a time-decayed quality score.

**1.3 Extend `listApproved` query in `stories.ts`**
Add sort option `"trending"` that orders by `trendingScore` descending.
Add `featuredUntil` filter: stories where `featuredUntil > now` always appear in a "Fresh" shelf query.

**1.4 New query: `listFreshLaunches`**
File: `my-app/convex/stories.ts`
Returns approved stories where `_creationTime > now - 48h`, ordered by creation time.
This powers the "Fresh Launches" shelf — every new submission gets 48h of guaranteed visibility.

**1.5 New query: `listByBuildingStatus`**
File: `my-app/convex/stories.ts`
Filter stories by `buildingStatus` field. Powers "In Beta" and "Building" discovery shelves.

**1.6 Scoring formula documentation query**
File: `my-app/convex/settings.ts` — add a `getScoringFormula` query that returns the formula string. This feeds the public `/scoring` page so the formula is stored in one place and always accurate.

### Frontend Tasks

**1.7 Add `buildingStatus` to `StoryForm.tsx`**
Add a select field: Idea / Building / Beta / Live / Acquired / Sunset.
Show it prominently on story cards and `StoryDetail.tsx` with a colored badge.

**1.8 Homepage multi-shelf layout**
File: `my-app/src/app/(main)/page.tsx`
Replace the single paginated list with stacked shelves:
- "Fresh Launches" (last 48h) — horizontal scroll on mobile, grid on desktop
- "Trending This Week" (trendingScore, time-decayed)
- "Matched for You" (existing `MatchedStoriesShelf` — promote this higher)
- "In Beta — Try Early" (buildingStatus = beta)
- Standard paginated feed below

**1.9 Sort option "Trending" in `Layout.tsx` filter bar**
Add `"trending"` to the sort period `<select>` in `Layout.tsx`.
Wire it through `LayoutContext` → `page.tsx` → `listApproved` query.

**1.10 New page: `/scoring`**
File: `my-app/src/app/(main)/scoring/page.tsx`
A simple static-ish page that explains the ranking formula, what "Vibes" means, how trending score works, and what gets filtered. Link it from the footer and from story cards' vote count tooltip.
This is a direct counter-narrative to PH's opaque points system.

**1.11 Complete `/leaderboard` page**
File: `my-app/src/app/(main)/leaderboard/page.tsx`
Tabs: Daily / Weekly / Monthly / All Time
Show rank, story card, vote count, rating, comment count, trending score.
Add a small "How is this ranked?" link that opens the `/scoring` page.

**1.12 Complete `/explore` page**
File: `my-app/src/app/(main)/explore/page.tsx`
Grid of tag-based shelves. Each tag shows its top 3 stories this week.
"Explore by category" — replaces the empty route with real content.

---

## Phase 2 — Comment Quality & Authentic Conversations
**Goal:** Make comments worth reading. Reward depth, surface maker responses, collapse spam.
**Timeline:** 1–2 weeks

### Backend Tasks

**2.1 Add comment quality fields to schema**
File: `my-app/convex/schema.ts` — extend `comments` table:
```
isMakerResponse: v.optional(v.boolean()),  // auto-set when commenter is story author
wordCount: v.optional(v.number()),          // computed on insert
isQuestion: v.optional(v.boolean()),        // contains "?"
qualityScore: v.optional(v.number()),       // computed: wordCount*0.5 + isQuestion*10 + votes*5
flaggedAsLowQuality: v.optional(v.boolean()),
```

**2.2 Auto-set `isMakerResponse` on comment insert**
File: `my-app/convex/comments.ts` — in the `add` mutation:
```typescript
const story = await ctx.db.get(args.storyId);
const isMakerResponse = story?.userId === currentUser._id;
// compute wordCount, isQuestion, qualityScore
```

**2.3 New query: `listTopCommentsByStory`**
File: `my-app/convex/comments.ts`
Returns comments sorted by `qualityScore` descending. Used for "Top Conversations" tab.

**2.4 Low-quality comment auto-collapse**
In `listApprovedByStory`, add a `isCollapsed` computed field:
`wordCount < 8 && !isQuestion && votes <= 0 && !isMakerResponse` → collapsed by default.

**2.5 Comment-to-vote ratio on stories**
File: `my-app/convex/stories.ts` — add `commentToVoteRatio` as a computed field in `fetchTagsAndCountsForStories`:
```typescript
commentToVoteRatio: story.votes > 0 ? story.commentCount / story.votes : 0
```
Expose this in `StoryWithDetails`. Used for "authentic engagement" badge on cards.

### Frontend Tasks

**2.6 Maker response badge in `Comment.tsx`**
When `comment.isMakerResponse === true`, show a "Maker" badge (colored pill) next to the author name. Pin maker responses to the top of the comment list.

**2.7 Structured feedback prompts in `CommentForm.tsx`**
Above the textarea, show 3 clickable prompt chips:
- "What problem does this solve for you?"
- "What feature is missing?"
- "How does this compare to alternatives?"
Clicking a chip pre-fills the textarea with the prompt text. Chips disappear once user starts typing.

**2.8 Comment tabs in `StoryDetail.tsx`**
Replace the single comment list with two tabs:
- "Top" — sorted by `qualityScore`
- "Recent" — sorted by `_creationTime`
Collapsed low-quality comments show as "Show 3 short comments" expandable row.

**2.9 Comment quality indicator on story cards in `StoryList.tsx`**
Next to the comment count, show a small colored dot:
- Green: `commentToVoteRatio >= 0.1` (healthy conversation)
- Yellow: `0.03–0.1`
- Grey: `< 0.03` (mostly votes, few comments)
Tooltip: "X% comment engagement rate"

**2.10 "Authentic engagement" badge on `StoryDetail.tsx`**
If `commentToVoteRatio >= 0.1` AND `commentsCount >= 5`, show a small "Active Discussion" badge near the stats row.

---

## Phase 3 — Builder Analytics Dashboard
**Goal:** Give submitters real data about their launch. PH gives almost nothing. This is a major retention driver for builders.
**Timeline:** 2–3 weeks

### Backend Tasks

**3.1 New query: `getStoryAnalytics`**
File: `my-app/convex/stories.ts`
Args: `{ storyId, ownerId }` — validates ownership before returning.
Returns:
```typescript
{
  totalViews: number,           // from a new views table (see 3.2)
  voteVelocity: number[],       // votes per day for last 30 days
  ratingHistory: number[],      // avg rating per day
  commentQualityBreakdown: { high: number, medium: number, low: number },
  bookmarkCount: number,
  icpMatchRate: number,         // % of visitors whose ICP matched this story
  topReferrers: string[],       // from views table
  followerCount: number,        // productFollows count
  engagementByDay: DailyEngagement[],  // from existing dailyEngagementSummary
}
```

**3.2 New `storyViews` table in schema**
File: `my-app/convex/schema.ts`
```
storyViews: defineTable({
  storyId: v.id("stories"),
  userId: v.optional(v.id("users")),
  sessionId: v.string(),          // anonymous tracking
  referrer: v.optional(v.string()),
  icpMatched: v.optional(v.boolean()),
  viewedAt: v.number(),
}).index("by_storyId_viewedAt", ["storyId", "viewedAt"])
  .index("by_storyId_sessionId", ["storyId", "sessionId"])
```

**3.3 Track views on story page load**
File: `my-app/convex/stories.ts` — new mutation `trackView`
Called from `StoryDetail.tsx` on mount. Deduplicates by `sessionId` within 24h.

**3.4 New `featureRequests` table in schema**
File: `my-app/convex/schema.ts`
```
featureRequests: defineTable({
  storyId: v.id("stories"),
  userId: v.id("users"),
  title: v.string(),
  description: v.optional(v.string()),
  votes: v.number(),
  status: v.union(v.literal("open"), v.literal("planned"), v.literal("shipped"), v.literal("declined")),
}).index("by_storyId_votes", ["storyId", "votes"])
```
New file: `my-app/convex/featureRequests.ts` with CRUD + vote mutation.

**3.5 New `productInterests` table (waitlist capture)**
File: `my-app/convex/schema.ts`
```
productInterests: defineTable({
  storyId: v.id("stories"),
  userId: v.id("users"),
  interestedAt: v.number(),
  useCase: v.optional(v.string()),  // "What would you use this for?"
}).index("by_storyId", ["storyId"])
  .index("by_userId", ["userId"])
```
New file: `my-app/convex/productInterests.ts`

**3.6 30-day follow-up email trigger**
File: `my-app/convex/crons.ts` — add daily cron
File: `my-app/convex/emails/followup.ts`
For each `productFollow` where `followedAt` is ~30 days ago and user hasn't left a rating:
Send "Still using [product]? Leave a quick rating" email via existing Resend infrastructure.

### Frontend Tasks

**3.7 New page: `/s/[slug]/analytics`**
File: `my-app/src/app/(main)/s/[slug]/analytics/page.tsx`
Only visible to story owner. Shows:
- Views over time (line chart using a lightweight lib or CSS-only bars)
- Vote velocity (bar chart by day)
- Rating trend
- Comment quality breakdown (pie/donut)
- ICP match rate
- Bookmark count
- Top referrers list
- "Export CSV" button for lead data

**3.8 Analytics tab on `StoryDetail.tsx`**
When `currentUser._id === story.userId`, show an "Analytics" tab alongside the existing content.
Tab renders the analytics data inline without navigating away.

**3.9 Feature Request board on `StoryDetail.tsx`**
New "Requests" tab on story detail page.
Shows list of feature requests sorted by votes.
Logged-in users can submit new requests and upvote existing ones.
Maker can update status (planned/shipped/declined) — shows as colored badge.

**3.10 "I'm Interested" button on story cards and detail**
File: `my-app/src/components/StoryList.tsx` and `StoryDetail.tsx`
A secondary CTA button (distinct from the vote button): "I'm Interested"
On click: opens a small modal asking "What would you use this for?" (optional) then saves to `productInterests`.
Shows count: "47 interested"
Makers see this count in their analytics dashboard.

**3.11 Builder dashboard section on profile page**
File: `my-app/src/app/(main)/[username]/page.tsx`
When viewing own profile, add a "Your Submissions" section with mini analytics cards per story:
- Views, votes, ratings, comments, interested count
- Quick link to full analytics page
- `buildingStatus` badge with inline edit

---

## Phase 4 — Anti-Gaming & Trust Signals
**Goal:** Build platform credibility before gaming becomes a problem. Transparent trust signals are a direct PH counter-narrative.
**Timeline:** 1–2 weeks

### Backend Tasks

**4.1 Suspicious vote detection**
File: `my-app/convex/stories.ts` — in `voteStory` mutation:
```typescript
// Flag vote as suspicious if:
// - user account < 7 days old
// - user has voted on < 3 total stories
// - this is their first vote on any story
const accountAgeDays = (Date.now() - user._creationTime) / 86400000;
const totalVotes = await ctx.db.query("votes").withIndex("by_userId", ...).collect();
const isSuspicious = accountAgeDays < 7 && totalVotes.length < 3;
```
Add `isSuspicious: v.optional(v.boolean())` to `votes` table.
In `trendingScore` computation, weight suspicious votes at 0.3×.

**4.2 Vote quality breakdown on stories**
File: `my-app/convex/stories.ts` — add to `StoryWithDetails`:
```typescript
voteQuality: {
  total: number,
  established: number,   // non-suspicious
  percentage: number,    // established / total * 100
}
```

**4.3 Coordinated voting pattern detection**
File: `my-app/convex/crons.ts` — daily cron
Check: if >10 new accounts (< 3 days old) voted on the same story within 1 hour → flag story for admin review.
Add `suspiciousActivityFlag: v.optional(v.boolean())` to stories schema.
Surface in admin `ContentModeration.tsx`.

**4.4 Verified Maker auto-badge**
File: `my-app/convex/comments.ts` — in `add` mutation:
Auto-set `isMakerResponse` (already planned in Phase 2).
File: `my-app/convex/users.ts` — extend `isVerified` to include a `verifiedAs` field:
`verifiedAs: v.optional(v.union(v.literal("maker"), v.literal("user"), v.literal("admin")))`

### Frontend Tasks

**4.5 Vote quality indicator on `StoryDetail.tsx`**
Near the vote count, show: "142 vibes — 89% from established accounts"
Small info icon with tooltip explaining what "established" means.
Only show when `voteQuality.percentage < 85` (otherwise don't draw attention to it).

**4.6 Verified Maker badge in `StoryDetail.tsx` and `Comment.tsx`**
When `comment.isMakerResponse && story.author.isVerified`, show a "✓ Verified Maker" badge.
On story cards, show a small verified checkmark next to the author name.

**4.7 Transparent "How ranking works" tooltip**
File: `my-app/src/components/StoryList.tsx`
On the vote/vibe button, add a small `?` icon that opens a popover:
"Vibes = votes + ratings + comments, time-decayed. See full formula →" (links to `/scoring`)

---

## Phase 5 — Community Beyond Launch Day
**Goal:** Turn Shipgrid from a one-day event into an ongoing product-builder community.
**Timeline:** 2–3 weeks

### Backend Tasks

**5.1 Tag community feed query**
File: `my-app/convex/stories.ts` — new query `listByTagWithActivity`
Returns stories for a tag sorted by recent comment activity (not just creation time).
Also returns top commenters in that tag this week.

**5.2 Category-specific weekly digest**
File: `my-app/convex/emails/weekly.ts` — extend existing weekly digest
For users who follow specific tags (via `selectedTagId` preference — needs to be persisted):
Send "Top 5 AI tools this week" instead of generic digest.
New field on `emailSettings` table: `followedTagIds: v.optional(v.array(v.id("tags")))`

**5.3 Public changelog / updates on stories**
File: `my-app/convex/stories.ts` — new mutation `postUpdate`
Args: `{ storyId, updateText, updateType: "feature" | "fix" | "milestone" | "launch" }`
Stores in a new `storyUpdates` table (separate from `changeLog` which is internal edit tracking).
Triggers notification to all `productFollows` for that story.

**5.4 New `storyUpdates` table**
File: `my-app/convex/schema.ts`
```
storyUpdates: defineTable({
  storyId: v.id("stories"),
  userId: v.id("users"),
  content: v.string(),
  updateType: v.union(v.literal("feature"), v.literal("fix"), v.literal("milestone"), v.literal("launch")),
  _creationTime: v.number(),  // auto
}).index("by_storyId", ["storyId"])
```
New file: `my-app/convex/storyUpdates.ts`

**5.5 Persist user tag preferences**
File: `my-app/convex/schema.ts` — add to `users` table:
`followedTagIds: v.optional(v.array(v.id("tags")))`
File: `my-app/convex/users.ts` — new mutation `updateFollowedTags`

### Frontend Tasks

**5.6 Complete `/tag/[slug]` community page**
File: `my-app/src/app/(main)/tag/[slug]/page.tsx`
Sections:
- Tag header with description, color, emoji
- "Trending in [tag] this week" — top 3 stories
- "New in [tag]" — recent submissions
- "Active discussions" — stories with most recent comment activity
- "Top builders in [tag]" — users with most submissions in this tag
- Follow tag button (persists to user preferences)

**5.7 Public "Updates" tab on `StoryDetail.tsx`**
New tab: "Updates" alongside Comments.
Shows `storyUpdates` in reverse chronological order with update type badge.
Maker sees a "Post Update" button that opens a small form.
Non-makers see a "Follow for updates" button (wires to `productFollows`).

**5.8 "Building Status" badge on story cards**
File: `my-app/src/components/StoryList.tsx`
Show `buildingStatus` as a small colored pill on each card:
- 🔵 Idea, 🟡 Building, 🟠 Beta, 🟢 Live, 🏆 Acquired, ⚫ Sunset
Users can filter by status in the filter bar.

**5.9 Tag follow UI in filter bar**
File: `my-app/src/components/Layout.tsx`
When a tag pill is selected, show a small "Follow [tag]" button next to it.
Saves to user's `followedTagIds`. Followed tags get a subtle indicator dot.

**5.10 Complete `/compare` page**
File: `my-app/src/app/(main)/compare/page.tsx`
Side-by-side comparison of 2–3 products.
URL: `/compare?a=[slug1]&b=[slug2]`
Shows: screenshots, description, tags, votes, rating, comments, buildingStatus, links.
Share button generates a shareable URL.

---

## Phase 6 — Email & Notification Upgrades
**Goal:** Make emails feel personal and valuable, not generic blasts.
**Timeline:** 1 week

### Backend Tasks

**6.1 Category digest email template**
File: `my-app/convex/emails/templates.ts` — new `generateCategoryDigest` template
Personalized subject: "Top 5 [AI Tools / Dev Tools / etc.] this week on Shipgrid"
Body: top 5 stories in user's followed tags with vote count, rating, one-line description.

**6.2 Feature request notification email**
File: `my-app/convex/emails/templates.ts` — new `generateFeatureRequestEmail`
Sent to story owner when a new feature request is submitted.
Sent to feature request submitter when maker updates status to "planned" or "shipped".

**6.3 "Still using?" follow-up email**
File: `my-app/convex/emails/followup.ts`
30 days after `productFollow`, if user hasn't rated: send follow-up.
Subject: "Still using [Product Name]? Quick question."
CTA: "Leave a rating" → deep links to story with rating pre-focused.

**6.4 Add new email types to `sendEmail` in `resend.ts`**
Add to the `emailType` union:
```typescript
v.literal("category_digest"),
v.literal("feature_request_notification"),
v.literal("followup_rating_request"),
v.literal("story_update_notification"),
```

### Frontend Tasks

**6.5 Email preferences UI upgrade**
File: `my-app/src/app/(main)/user-settings/page.tsx`
Add granular toggles for new email types:
- Category digest (with tag selector)
- Feature request notifications
- Story update notifications from followed products
- 30-day follow-up requests

---

## Phase 7 — Quick Wins (Ship First)
These are low-effort, high-signal. Do these before anything else.

| Task | File | Effort |
|------|------|--------|
| Show `averageRating` prominently on story cards | `StoryList.tsx` | 30 min |
| Auto-set `isMakerResponse` on comment insert | `comments.ts` | 1 hr |
| Add "Maker" badge to comments | `Comment.tsx` | 30 min |
| Add `buildingStatus` field to schema + submit form | `schema.ts`, `StoryForm.tsx` | 2 hr |
| Add structured feedback prompt chips to `CommentForm.tsx` | `CommentForm.tsx` | 1 hr |
| Complete `/leaderboard` with transparent scoring | `leaderboard/page.tsx` | 3 hr |
| Add "How ranking works" tooltip to vote button | `StoryList.tsx` | 1 hr |
| Show comment count quality dot on story cards | `StoryList.tsx` | 1 hr |
| Add `featuredUntil` to schema + set on approval | `schema.ts`, `stories.ts` | 2 hr |
| "Fresh Launches" shelf on homepage | `page.tsx` | 2 hr |

---

## What NOT to Build

- A single "Product of the Day" winner banner — creates the same winner-takes-all dynamic as PH
- Opaque "points" system — document everything publicly
- Vote-only ranking — always weight comments and ratings more heavily
- Paid upvote packages — offer transparent sponsored slots instead (labeled clearly)

---

## File Creation Summary

### New Convex Backend Files
```
my-app/convex/trending.ts          — trendingScore computation cron
my-app/convex/featureRequests.ts   — feature request CRUD + voting
my-app/convex/productInterests.ts  — "I'm interested" / waitlist capture
my-app/convex/storyUpdates.ts      — public changelog updates
my-app/convex/emails/followup.ts   — 30-day follow-up email logic
```

### New Frontend Pages
```
my-app/src/app/(main)/scoring/page.tsx              — transparent ranking formula
my-app/src/app/(main)/explore/page.tsx              — tag-based exploration grid
my-app/src/app/(main)/s/[slug]/analytics/page.tsx   — builder analytics dashboard
my-app/src/app/(main)/compare/page.tsx              — side-by-side product compare
```

### Files to Extend (not replace)
```
my-app/convex/schema.ts            — add trendingScore, featuredUntil, buildingStatus, storyViews, featureRequests, productInterests, storyUpdates
my-app/convex/stories.ts           — add trending sort, trackView, getStoryAnalytics, listFreshLaunches
my-app/convex/comments.ts          — add isMakerResponse, wordCount, qualityScore, listTopComments
my-app/convex/crons.ts             — add trending score cron, follow-up email cron, suspicious vote cron
my-app/convex/emails/templates.ts  — add category digest, feature request, follow-up templates
my-app/convex/emails/resend.ts     — add new emailType literals
my-app/convex/users.ts             — add followedTagIds, verifiedAs
my-app/src/components/StoryList.tsx        — rating display, comment quality dot, buildingStatus badge, interested button
my-app/src/components/StoryDetail.tsx      — analytics tab, updates tab, feature requests tab, vote quality indicator
my-app/src/components/Comment.tsx          — maker badge, quality-based collapse
my-app/src/components/CommentForm.tsx      — structured feedback prompt chips
my-app/src/components/Layout.tsx           — trending sort option, tag follow button
my-app/src/app/(main)/page.tsx             — multi-shelf homepage layout
my-app/src/app/(main)/leaderboard/page.tsx — complete with transparent scoring
my-app/src/app/(main)/tag/[slug]/page.tsx  — full community feed page
```

---

## Competitive Differentiation Summary

| Feature | Product Hunt | Shipgrid (After Plan) |
|---------|-------------|----------------------|
| Ranking formula | Hidden "points" | Public formula at /scoring |
| Discovery surfaces | 1 global leaderboard | 6+ shelves + ICP matching |
| New launch visibility | Sink or swim | 48h guaranteed window |
| Comment quality | No signal | Quality score + maker badge |
| Builder analytics | None | Full dashboard + CSV export |
| Waitlist/interest capture | None | "I'm Interested" per product |
| Feature requests | None | Per-product board with status |
| Product updates | None | Public changelog tab |
| Vote trust signal | None | "89% established accounts" |
| Tag communities | None | Full community feed per tag |
| Product comparison | None | Side-by-side /compare |
| Building status | None | idea→building→beta→live→sunset |
| Follow-up engagement | None | 30-day rating request email |
| ICP semantic matching | None | Already built, needs promotion |
