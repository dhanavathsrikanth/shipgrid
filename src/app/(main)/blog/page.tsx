import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog — Insights for Builders & Founders | Shipgrid",
  description:
    "Guides, strategies, and insights for indie hackers, SaaS founders, and makers. Learn where to share your side project, what is vibe coding, and how to get your first users.",
  keywords:
    "builder blog, indie hacker guide, SaaS launch strategy, vibe coding, side project advice, founder insights",
  openGraph: {
    title: "Shipgrid Blog — For Builders & Founders",
    description: "Guides and insights for indie makers and SaaS founders.",
    url: "https://goshipgrid.app/blog",
    type: "website",
    siteName: "Shipgrid",
  },
  alternates: { canonical: "https://goshipgrid.app/blog" },
};

const posts = [
  {
    slug: "what-is-vibe-coding",
    title: "What is vibe coding? The complete builder's guide (2025)",
    description:
      "Vibe coding is reshaping how indie builders ship products. Here's what it means, which tools to use, and how to ship faster with AI.",
    tag: "Trending",
    tagClass: "bg-primary/10 text-primary",
    readTime: "7 min read",
  },
  {
    slug: "where-to-share-side-project",
    title: "Best places to share your side project and get real users (2025)",
    description:
      "An honest breakdown of ProductHunt, Hacker News, Reddit, Indie Hackers, and Shipgrid — with scores and what each is actually good for.",
    tag: "For Builders",
    tagClass: "bg-muted text-muted-foreground",
    readTime: "6 min read",
  },
];

export default function BlogIndexPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-12">

      {/* Header */}
      <section className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Blog</h1>
        <p className="text-lg text-muted-foreground">
          Guides and insights for indie builders, SaaS founders, and makers.
        </p>
      </section>

      {/* Posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block p-6 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-200"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${post.tagClass}`}>
                  {post.tag}
                </span>
                <span className="text-xs text-muted-foreground">{post.readTime}</span>
              </div>
              <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                {post.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {post.description}
              </p>
              <div className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Read article →
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="border-t border-border pt-10 text-center space-y-3">
        <p className="text-muted-foreground text-sm">
          Building something? Ship it to the right audience.
        </p>
        <Link
          href="/submit"
          className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Submit your product →
        </Link>
      </div>
    </div>
  );
}
