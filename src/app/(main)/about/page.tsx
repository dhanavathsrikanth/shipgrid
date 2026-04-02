import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Shipgrid — AI-Matched Product Discovery for Builders",
  description:
    "Shipgrid is where indie builders ship their apps and buyers discover exactly what they need — matched by AI based on role, problem, and budget. Learn why we built it and how it's different.",
  keywords:
    "about Shipgrid, product hunt alternative, AI product discovery, builder community, indie makers platform, ship side projects",
  openGraph: {
    title: "About Shipgrid — AI-Matched Product Discovery",
    description:
      "Not another launch board. Shipgrid uses AI to match products to the right people — by role, problem, and budget.",
    url: "https://goshipgrid.app/about",
    type: "website",
  },
  alternates: { canonical: "https://goshipgrid.app/about" },
};

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Shipgrid",
  description:
    "Shipgrid is an AI-matched product discovery platform where builders ship their apps and buyers find exactly what they need.",
  url: "https://goshipgrid.app/about",
  mainEntity: {
    "@type": "Organization",
    name: "Shipgrid",
    url: "https://goshipgrid.app",
    description:
      "AI-matched product discovery platform for indie builders and founders.",
    foundingDate: "2025",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Shipgrid?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Shipgrid is an AI-matched product discovery platform where indie builders share their apps and buyers discover tools matched to their specific role, problem, and budget — unlike generic launch boards.",
      },
    },
    {
      "@type": "Question",
      name: "How is Shipgrid different from ProductHunt?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ProductHunt is a launch-day voting contest. Shipgrid is always-on discovery — your product keeps finding the right audience over time, matched by AI to users whose role and problem your tool solves.",
      },
    },
    {
      "@type": "Question",
      name: "Is Shipgrid free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Submitting your product and discovering tools on Shipgrid is free. Sign up, complete your ICP profile, and get matched to products and people in your niche.",
      },
    },
    {
      "@type": "Question",
      name: "Who is Shipgrid for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Shipgrid is built for indie developers, solo founders, and SaaS builders who want their products seen by the right audience — and for buyers who want curated tool recommendations instead of trending noise.",
      },
    },
  ],
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(aboutJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-20">

        {/* Hero */}
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            About Shipgrid
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground leading-tight">
            Product discovery that actually works —<br />
            <span className="text-primary">matched to you.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Shipgrid is an AI-matched product discovery platform where serious builders ship their work and
            serious buyers find exactly what they need. Not by trending votes. By relevance to{" "}
            <em>you</em>.
          </p>
        </section>

        {/* The Problem */}
        <section className="space-y-4 border-l-2 border-primary/30 pl-6">
          <h2 className="text-xl font-semibold text-foreground">
            The problem with every other launch platform
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            ProductHunt shows you what's trending today. BetaList shows you what was submitted last week.
            Neither of them knows anything about <em>you</em> — your role, the problem you're trying to
            solve, your budget, or your stage.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The result? Builders spend launch day praying for upvotes from a random audience. Buyers scroll
            through noise searching for something, anything, that actually fits their workflow.
          </p>
          <p className="text-foreground font-medium">
            We built Shipgrid to fix this.
          </p>
        </section>

        {/* How it works */}
        <section className="space-y-8">
          <h2 className="text-xl font-semibold text-foreground">How Shipgrid works</h2>
          <div className="grid gap-6">
            {[
              {
                step: "01",
                title: "Set your ICP profile",
                desc: "Tell us your role, the primary problem you're solving, and your budget range. Takes 60 seconds.",
              },
              {
                step: "02",
                title: "Get matched products",
                desc: "Our AI uses semantic vector matching to surface products that are actually relevant to your profile — not just what's trending.",
              },
              {
                step: "03",
                title: "Engage with real builders",
                desc: "Follow builders, vote on products you love, leave feedback, and get notified when they ship something new.",
              },
              {
                step: "04",
                title: "Ship your own work",
                desc: "Submit your product with ICP metadata so it reaches the right audience automatically — no launch-day lottery needed.",
              },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="flex gap-5 p-5 rounded-lg border border-border bg-card"
              >
                <span className="text-primary font-mono text-sm font-bold shrink-0 mt-0.5">
                  {step}
                </span>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Vs competition */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">
            Shipgrid vs other platforms
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-3 text-foreground font-medium">Feature</th>
                  <th className="text-center px-4 py-3 text-primary font-semibold">Shipgrid</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">ProductHunt</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Peerlist</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">BetaList</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["AI-matched discovery", "✅", "❌", "❌", "❌"],
                  ["Always-on (not just launch day)", "✅", "❌", "✅", "⚠️"],
                  ["ICP targeting by role + budget", "✅", "❌", "❌", "❌"],
                  ["Builder community & follows", "✅", "⚠️", "✅", "❌"],
                  ["Founder analytics", "✅", "❌", "❌", "❌"],
                  ["AI-generated FAQs per product", "✅", "❌", "❌", "❌"],
                ].map(([feature, ...vals]) => (
                  <tr key={feature} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-foreground">{feature}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="px-4 py-3 text-center">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Is Shipgrid free?",
                a: "Yes. Submitting your product and discovering tools is completely free. Sign up, complete your profile, and start exploring.",
              },
              {
                q: "How is this different from ProductHunt?",
                a: "ProductHunt is a 24-hour launch contest. Shipgrid is always-on — your product keeps finding new, relevant users over time. No launch lottery, no upvote brigading.",
              },
              {
                q: "Who is Shipgrid built for?",
                a: "Indie developers, SaaS founders, and solo builders who want their work seen by the right people. And buyers who want curated recommendations, not viral trending noise.",
              },
              {
                q: "How does the AI matching work?",
                a: "When you complete your ICP profile (role, problem, budget), we generate a semantic embedding. Each product also has an embedding. We match you to products with high semantic similarity — so you see tools that actually solve your problem.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="p-5 rounded-lg border border-border bg-card space-y-2">
                <h3 className="font-semibold text-foreground">{q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4 py-8 px-6 rounded-xl border border-primary/20 bg-primary/5">
          <h2 className="text-2xl font-bold text-foreground">Ready to ship to the right audience?</h2>
          <p className="text-muted-foreground">
            Join builders who are done with launch-day lotteries.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="/submit"
              className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Submit your product →
            </a>
            <a
              href="/"
              className="inline-flex items-center px-5 py-2.5 border border-border bg-card text-foreground rounded-md font-medium text-sm hover:bg-muted transition-colors"
            >
              Browse apps
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
