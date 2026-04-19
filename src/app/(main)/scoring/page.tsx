"use client";

import Link from "next/link";
import { Info, Clock, Star, MessageSquare, ThumbsUp, Shield, Zap } from "lucide-react";

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
          Unlike platforms with hidden &ldquo;points&rdquo; systems, Shipgrid&apos;s ranking is fully
          transparent. Here&apos;s exactly how it works.
        </p>
      </div>

      {/* The Formula */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          The Trending Formula
        </h2>
        <div className="bg-muted rounded-lg p-5 font-mono text-sm border border-border mb-4">
          <p className="text-foreground leading-relaxed">
            trendingScore ={" "}
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
          <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
            <ThumbsUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Votes (Vibes)</p>
              <p className="text-xs text-muted-foreground">
                Each vibe adds 1 point. Suspicious votes from brand-new accounts are weighted at 0.3×.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
            <Star className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Ratings</p>
              <p className="text-xs text-muted-foreground">
                1–10 star ratings are weighted 10× per rating × the number of raters. Quality over volume.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
            <MessageSquare className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Comments</p>
              <p className="text-xs text-muted-foreground">
                Each approved comment adds 3× to the score — real conversations matter more than passive votes.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
            <Clock className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Time Decay</p>
              <p className="text-xs text-muted-foreground">
                Score is divided by age in hours raised to 1.5 — recent activity is boosted, but strong older products fade slowly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sort options */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">Sort Options</h2>
        <div className="space-y-2 text-sm">
          {[
            { label: "New", desc: "Newest submissions first. Default feed — chronological." },
            { label: "Trending", desc: "Sorted by trendingScore — balances votes, ratings, comments, and recency." },
            { label: "Top Today / Week / Month / Year", desc: "Sorted by raw vote count in that time window." },
          ].map(({ label, desc }) => (
            <div key={label} className="flex gap-3 p-3 bg-muted rounded-lg">
              <span className="font-medium text-foreground w-36 flex-shrink-0">{label}</span>
              <span className="text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Guaranteed exposure */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          48-Hour Guaranteed Visibility (Coming Soon)
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Every newly approved product gets a{" "}
          <strong className="text-foreground">48-hour featured window</strong> — guaranteed
          placement in the &ldquo;Fresh Launches&rdquo; shelf. This means no product disappears
          instantly the way they do on platforms with single daily leaderboards.
        </p>
      </section>

      {/* Trust signals */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-500" />
          Anti-Gaming Trust Signals
        </h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Suspicious votes</strong> — votes cast by accounts
            less than 7 days old with fewer than 3 total votes are weighted at <strong>0.3×</strong> in
            the trending formula. They still count, just not as much.
          </p>
          <p>
            <strong className="text-foreground">Coordinated voting detection</strong> — if more than
            10 brand-new accounts vote on the same product within an hour, it gets flagged for
            admin review.
          </p>
          <p>
            <strong className="text-foreground">What "established account" means</strong> — an
            account that is at least 7 days old and has voted on at least 3 different products.
          </p>
          <p>
            <strong className="text-foreground">Comment quality scoring</strong> — comments shorter
            than 8 words with no question are collapsed by default. Maker responses (from the
            product owner) are always shown and pinned to the top.
          </p>
        </div>
      </section>

      {/* What we don't do */}
      <section className="p-5 rounded-lg bg-muted border border-border">
        <h2 className="text-base font-semibold mb-3">What We Deliberately Don&apos;t Do</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-red-500 font-bold flex-shrink-0">✕</span>
            <span>Hidden &ldquo;points&rdquo; system — every signal is documented here</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 font-bold flex-shrink-0">✕</span>
            <span>Single &ldquo;Product of the Day&rdquo; winner that crowds out everything else</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 font-bold flex-shrink-0">✕</span>
            <span>Vote-only ranking — ratings and real conversations always count</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 font-bold flex-shrink-0">✕</span>
            <span>Paid upvote packages — we only offer clearly-labeled sponsored slots</span>
          </li>
        </ul>
      </section>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to products
        </Link>
      </div>
    </div>
  );
}
