import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best Places to Share Your Side Project in 2025 — Shipgrid",
  description:
    "Where to share your side project and actually get users, not just impressions. A founder's guide to the best platforms in 2025 — including why launch-day voting is dead.",
  keywords:
    "where to share side project, best places launch startup, product hunt alternative, share indie project, get first users SaaS, show side project",
  openGraph: {
    title: "Best Places to Share Your Side Project in 2025",
    description:
      "ProductHunt, Hacker News, Reddit, or Shipgrid? Here's where to actually share your side project to get real users.",
    url: "https://shipgrid.io/blog/where-to-share-side-project",
    type: "article",
    siteName: "Shipgrid",
  },
  alternates: { canonical: "https://shipgrid.io/blog/where-to-share-side-project" },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best Places to Share Your Side Project in 2025",
  description:
    "A founder's guide to where to share a side project and get real users — beyond ProductHunt.",
  url: "https://shipgrid.io/blog/where-to-share-side-project",
  author: { "@type": "Organization", name: "Shipgrid", url: "https://shipgrid.io" },
  publisher: { "@type": "Organization", name: "Shipgrid", url: "https://shipgrid.io" },
  datePublished: "2025-04-01",
  dateModified: "2025-04-01",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Where is the best place to share a side project?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The best places to share a side project in 2025 are: Shipgrid (AI-matched discovery), Hacker News Show HN, Indie Hackers, relevant subreddits (r/SaaS, r/SideProject), and DevHunt for developer tools. Sequence your launches across multiple platforms for compounding momentum.",
      },
    },
    {
      "@type": "Question",
      name: "Is ProductHunt still worth it in 2025?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ProductHunt is still valuable for brand visibility, but its algorithm rewards upvote quantity over product quality. In 2025, most successful indie founders use ProductHunt as one of several launch channels, not the primary one. Platforms like Shipgrid that use AI to match products to relevant audiences often drive higher-quality, longer-term traffic.",
      },
    },
    {
      "@type": "Question",
      name: "How do I get my first 100 users for a side project?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "To get your first 100 users: (1) Submit to AI-matched discovery platforms like Shipgrid, (2) Post a Show HN on Hacker News with a genuine, non-salesy description, (3) Share in targeted subreddits where your ICP hangs out, (4) Write a build-in-public thread on X/Twitter, (5) Reach out personally to potential users in communities you're already part of.",
      },
    },
  ],
};

const platforms = [
  {
    rank: 1,
    name: "Shipgrid",
    badge: "AI-Matched",
    badgeClass: "bg-primary/10 text-primary",
    verdict: "Best for: long-term, targeted discovery",
    pros: [
      "AI matches your product to users by role, problem, and budget",
      "Always-on — keeps finding new users after launch day",
      "Founder analytics + changelog updates",
      "AI-generated FAQs per product (SEO boost)",
    ],
    cons: ["Newer platform — smaller initial audience"],
    score: "9.5/10",
    link: "/submit",
    linkText: "Submit your app →",
  },
  {
    rank: 2,
    name: "Hacker News (Show HN)",
    badge: "High Risk, High Reward",
    badgeClass: "bg-amber-100 text-amber-700",
    verdict: "Best for: technical tools with developer audiences",
    pros: [
      "5,000–15,000 highly technical eyeballs in 24 hours",
      "Comments are genuinely useful feedback from smart people",
      "Strong SEO backlink from a DA 90+ domain",
    ],
    cons: [
      "Brutal if your product isn't technically impressive",
      "Must be genuine — zero tolerance for marketing speak",
      "Posts disappear from front page fast",
    ],
    score: "8/10",
  },
  {
    rank: 3,
    name: "Indie Hackers",
    badge: "Community Building",
    badgeClass: "bg-blue-100 text-blue-700",
    verdict: "Best for: build-in-public momentum and founder peers",
    pros: [
      "Share milestones + revenue numbers for high engagement",
      "Long-form posts get indexed well by Google",
      "Supportive community that actually reads what you write",
    ],
    cons: [
      "Lower conversion to paying users vs Hacker News",
      "Best used for relationship-building, not viral launches",
    ],
    score: "7.5/10",
  },
  {
    rank: 4,
    name: "ProductHunt",
    badge: "Launch Day Visibility",
    badgeClass: "bg-orange-100 text-orange-700",
    verdict: "Best for: one-day brand awareness burst",
    pros: [
      "Large audience of early adopters",
      "Strong media visibility if you hit top 5",
      "Good for social proof ('Featured on ProductHunt')",
    ],
    cons: [
      "24-hour window — if you don't hit it, you're buried",
      "Upvote brigading favors established networks over quality",
      "No audience targeting — your product reaches everyone and no one",
    ],
    score: "6.5/10",
  },
  {
    rank: 5,
    name: "Reddit (Niche Subreddits)",
    badge: "ICP Targeting",
    badgeClass: "bg-red-100 text-red-700",
    verdict: "Best for: high-conversion posts in the right community",
    pros: [
      "r/SaaS, r/SideProject, r/webdev — high-intent audiences",
      "If your post resonates, organic sharing is powerful",
      "Comments show you exactly what users think",
    ],
    cons: [
      "Self-promotion rules vary — read each sub carefully",
      "Can go negative fast if the community smells marketing",
    ],
    score: "7/10",
  },
];

export default function WherToSharePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-16">

        {/* Breadcrumb */}
        <nav className="flex gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Shipgrid</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-foreground">Where to share your side project</span>
        </nav>

        {/* Hero */}
        <section className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
              For Builders
            </span>
            <span className="px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
              2025 Guide
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground leading-tight">
            Best places to share your side project and get real users (2025)
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            You've built something. Now you need to get it in front of the right people — not just
            anyone. Here's an honest breakdown of where to share your side project in 2025, ranked by
            what actually works.
          </p>
          <p className="text-sm text-muted-foreground">
            Last updated: April 2025 · 6 min read
          </p>
        </section>

        {/* Answer-first paragraph — critical for GEO */}
        <section className="p-5 rounded-lg border-l-4 border-primary bg-primary/5 space-y-2">
          <p className="font-semibold text-foreground text-sm uppercase tracking-wide">Quick Answer</p>
          <p className="text-foreground leading-relaxed">
            The best places to share a side project in 2025 are: <strong>Shipgrid</strong> (AI-matched,
            always-on), <strong>Hacker News Show HN</strong> (technical audiences), <strong>Indie
            Hackers</strong> (community building), <strong>ProductHunt</strong> (launch-day visibility),
            and <strong>niche subreddits</strong> (high-intent targeting). Always sequence across
            multiple platforms — never put all your energy into one.
          </p>
        </section>

        {/* Why launch day is dead */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Why "launch day" is the wrong mental model
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Most founders treat a product launch as a single event — one big push, one big day, then
            hope the SEO kicks in. In 2025, this model is broken. Here's why:
          </p>
          <ul className="space-y-3 text-muted-foreground">
            {[
              "ProductHunt has 12k+ daily submissions — you're competing against everyone at once",
              "Upvote-based algorithms reward first-mover network effects, not product quality",
              "Launch-day traffic spikes are rarely the right users — they're curiosity browsers",
              "The conversion rate from \"launch day\" visitors to paying customers is often under 0.5%",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-destructive shrink-0 mt-0.5">✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            The better model is <strong className="text-foreground">always-on discovery</strong> —
            your product continuously finds new, relevant users over weeks and months, not in a single
            24-hour window.
          </p>
        </section>

        {/* Platform rankings */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Top 5 platforms ranked
          </h2>
          {platforms.map((p) => (
            <div key={p.name} className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-muted-foreground/30 font-mono">
                    #{p.rank}
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{p.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.badgeClass}`}>
                      {p.badge}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">{p.score}</div>
                  <div className="text-xs text-muted-foreground">score</div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm font-medium text-primary">{p.verdict}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pros</p>
                    <ul className="space-y-1.5">
                      {p.pros.map((pro) => (
                        <li key={pro} className="flex gap-2 text-sm text-foreground">
                          <span className="text-primary shrink-0">✓</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cons</p>
                    <ul className="space-y-1.5">
                      {p.cons.map((con) => (
                        <li key={con} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="text-muted-foreground shrink-0">—</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {p.link && (
                  <Link
                    href={p.link}
                    className="inline-flex items-center text-sm font-medium text-primary hover:opacity-80 transition-opacity"
                  >
                    {p.linkText}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Common questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Is ProductHunt still worth it in 2025?",
                a: "Yes — but only as one of several channels. Use it for brand visibility and social proof ('Featured on ProductHunt'), not as your primary user acquisition strategy. The days of PH making or breaking a product are largely over for most niches.",
              },
              {
                q: "How do I get my first 100 users?",
                a: "Submit to AI-matched discovery platforms like Shipgrid, post a Show HN on Hacker News, share in 2–3 targeted subreddits, and personally DM 10–20 people in communities where your ideal customer is already active. Do the unscalable things first.",
              },
              {
                q: "Should I launch everywhere at once or sequence?",
                a: "Sequence. Launch your product on Shipgrid first (always-on, no pressure), then do a Show HN when you have some traction data to share, then hit ProductHunt last when you have screenshots, testimonials, and a real story to tell.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group rounded-lg border border-border bg-card">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-foreground">
                  {q}
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                    ↓
                  </span>
                </summary>
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4 py-8 px-6 rounded-xl border border-primary/20 bg-primary/5">
          <h2 className="text-xl font-bold text-foreground">
            Ready to try always-on discovery?
          </h2>
          <p className="text-sm text-muted-foreground">
            Submit your product to Shipgrid and reach users who actually match your ICP.
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Submit your product free →
          </Link>
        </section>
      </div>
    </>
  );
}
