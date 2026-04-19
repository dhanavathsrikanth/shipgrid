import Link from "next/link";
import { Info, Clock, Star, MessageSquare, ThumbsUp, Shield, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "How Ranking Works | Shipgrid",
  description:
    "Full transparency on how Shipgrid ranks products — the trendingScore formula, sort options, anti-gaming signals, and what we deliberately don't do.",
};

export default function ScoringPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">How Ranking Works</h1>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Unlike platforms with hidden &ldquo;points&rdquo; systems, Shipgrid&apos;s ranking is
          fully transparent. Here&apos;s exactly how it works.
        </p>
      </div>

      {/* The Formula */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          The Trending Formula
        </h2>
        <div className="bg-muted rounded-lg p-5 font-mono text-sm border border-border mb-4 overflow-x-auto">
          <p className="text-foreground leading-relaxed whitespace-nowrap">
            score ={" "}
            <span className="text-primary font-bold">(votes</span>{" "}
            +{" "}
            <span className="text-amber-600 font-bold">avgRating × 10 × ratingCount</span>{" "}
            +{" "}
            <span className="text-emerald-600 font-bold">commentCount × 3</span>
            <span className="text-primary font-bold">)</span>{" "}
            ÷{" "}
            <span className="text-violet-600 font-bold">(hoursOld + 2)^1.5</span>
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              Icon: ThumbsUp,
              color: "text-primary",
              title: "Votes (Vibes)",
              desc: "Each vibe adds 1 point. Votes from brand-new accounts (<7 days old, <3 votes) are weighted at 0.3×.",
            },
            {
              Icon: Star,
              color: "text-amber-500",
              title: "Ratings",
              desc: "1–10 star ratings are weighted 10× per rating × number of raters. Quality over volume.",
            },
            {
              Icon: MessageSquare,
              color: "text-emerald-600",
              title: "Comments",
              desc: "Each approved comment adds 3× — real conversations matter more than passive votes.",
            },
            {
              Icon: Clock,
              color: "text-violet-600",
              title: "Time Decay",
              desc: "Score divides by age in hours raised to 1.5 — recent activity is boosted, older products fade slowly.",
            },
          ].map(({ Icon, color, title, desc }) => (
            <Card key={title}>
              <CardContent className="flex items-start gap-3 pt-4">
                <Icon className={`w-4 h-4 ${color} mt-0.5 flex-shrink-0`} />
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Sort options */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">Sort Options</h2>
        <div className="space-y-2 text-sm">
          {[
            { label: "New", desc: "Newest submissions first — default chronological feed." },
            { label: "Trending", desc: "Sorted by the formula above — balances votes, ratings, comments, and recency." },
            { label: "Top Today / Week / Month / Year", desc: "Sorted by raw vote count in that time window." },
          ].map(({ label, desc }) => (
            <div key={label} className="flex gap-3 p-3 bg-muted rounded-lg items-start">
              <Badge variant="secondary" className="flex-shrink-0 mt-0.5">{label}</Badge>
              <span className="text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Guaranteed exposure */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          48-Hour Guaranteed Visibility
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Every newly approved product receives a{" "}
          <strong className="text-foreground">48-hour featured window</strong> — guaranteed placement
          in the &ldquo;Fresh Launches&rdquo; shelf so no product disappears instantly. This directly
          addresses the single-day leaderboard problem that affects most discovery platforms.
        </p>
      </section>

      {/* Anti-gaming */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-500" />
          Anti-Gaming Trust Signals
        </h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Suspicious votes</strong> — accounts less than 7
            days old with fewer than 3 total votes are weighted at{" "}
            <strong>0.3×</strong> in the trending formula.
          </p>
          <p>
            <strong className="text-foreground">Comment quality scoring</strong> — comments shorter
            than 8 words with no question are soft-collapsed by default. Maker responses are always
            shown and pinned.
          </p>
          <p>
            <strong className="text-foreground">Maker badge</strong> — when the product owner
            replies, their comment is marked with a &ldquo;Maker&rdquo; badge so users know it&apos;s
            an official response.
          </p>
        </div>
      </section>

      {/* What we don't do */}
      <section className="p-5 rounded-lg bg-muted border border-border mb-10">
        <h2 className="text-base font-semibold mb-3">What We Deliberately Don&apos;t Do</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "Hidden \"points\" system — every signal is documented on this page",
            "Single \"Product of the Day\" winner that crowds out everything else",
            "Vote-only ranking — ratings and real conversations always count",
            "Paid upvote packages — we only offer clearly-labeled sponsored slots",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-red-500 font-bold flex-shrink-0">✕</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="text-center">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to products
        </Link>
      </div>
    </div>
  );
}
