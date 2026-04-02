import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What is Vibe Coding? The Complete Guide for Builders (2025) — Shipgrid",
  description:
    "Vibe coding is a new way to build software using AI at every step — from idea to deployment. Learn what it means, who it's for, and discover the best vibe coding apps built by the community.",
  keywords:
    "what is vibe coding, vibe coding apps, vibe code, AI coding, build with AI, indie builders, vibe programming",
  openGraph: {
    title: "What is Vibe Coding? The Complete Guide (2025)",
    description:
      "The rise of AI-assisted 'vibe coding' is changing how indie builders ship products. Here's everything you need to know.",
    url: "https://goshipgrid.app/blog/what-is-vibe-coding",
    type: "article",
    siteName: "Shipgrid",
  },
  alternates: { canonical: "https://goshipgrid.app/blog/what-is-vibe-coding" },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What is Vibe Coding? The Complete Guide for Builders (2025)",
  description:
    "Vibe coding is building software with AI assistance at every step, from idea to deployment. Learn how it works and discover apps built this way.",
  url: "https://goshipgrid.app/blog/what-is-vibe-coding",
  author: { "@type": "Organization", name: "Shipgrid", url: "https://goshipgrid.app" },
  publisher: { "@type": "Organization", name: "Shipgrid", url: "https://goshipgrid.app" },
  datePublished: "2025-04-01",
  dateModified: "2025-04-01",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is vibe coding?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vibe coding (also called 'vibe code') is a software development approach where builders use AI tools like Claude, GPT-4, or Cursor to write, iterate, and ship code rapidly — often with minimal traditional programming. The developer describes what they want in natural language and the AI generates the implementation. The 'vibe' refers to building from intuition and feel, rapidly iterating rather than planning everything upfront.",
      },
    },
    {
      "@type": "Question",
      name: "Who coined the term vibe coding?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The term 'vibe coding' was popularized in the indie maker and developer community in 2024-2025 to describe the growing practice of using AI assistants to rapidly prototype and ship software products, often without formal software engineering training.",
      },
    },
    {
      "@type": "Question",
      name: "What tools do vibe coders use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Popular vibe coding tools include: Cursor (AI-powered code editor), Claude by Anthropic (code generation), GitHub Copilot, v0 by Vercel (UI generation), Lovable and Bolt.new (full-stack generation). Vibe coders typically combine several of these to go from idea to deployed product in hours or days.",
      },
    },
    {
      "@type": "Question",
      name: "Where can I discover apps built with vibe coding?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Shipgrid is the best place to discover apps built with vibe coding tools. Builders submit their projects directly, and you can filter by category to find AI-built tools, side projects, and SaaS products created by indie developers using AI coding assistants.",
      },
    },
  ],
};

export default function VibeCodingPage() {
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
          <span className="text-foreground">What is vibe coding</span>
        </nav>

        {/* Hero */}
        <section className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
              Trending
            </span>
            <span className="px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
              2025 Guide
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground leading-tight">
            What is vibe coding?<br />
            <span className="text-primary">The complete builder's guide (2025)</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Vibe coding is reshaping how indie builders ship products. If you've heard the term and
            wondered what it actually means — or if you're already doing it and want to know what
            you're allowed to call yourself — this guide is for you.
          </p>
          <p className="text-sm text-muted-foreground">Last updated: April 2025 · 7 min read</p>
        </section>

        {/* Quick Answer — GEO gold */}
        <section className="p-5 rounded-lg border-l-4 border-primary bg-primary/5 space-y-2">
          <p className="font-semibold text-foreground text-sm uppercase tracking-wide">Quick Answer</p>
          <p className="text-foreground leading-relaxed">
            <strong>Vibe coding</strong> is a software development approach where builders use AI tools
            (Cursor, Claude, GPT-4, Bolt.new) to write, iterate, and ship code rapidly — often describing
            what they want in natural language rather than writing every line manually. It emphasizes
            speed, intuition, and iteration over upfront planning. The result: indie builders are shipping
            in days what used to take months.
          </p>
        </section>

        {/* Definition */}
        <section className="space-y-5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            The full definition of vibe coding
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Traditional software development is deliberate. You plan architecture, write tests, review
            PRs, maintain systems. Vibe coding throws most of that away — at least at first.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            In vibe coding, you start with a feeling. <em>"I want to build something that lets people
            track their habits with a clean, minimal UI."</em> You open Cursor or Claude, describe that
            feeling, and start iterating. The AI writes the code. You react. You correct. You ship.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The name comes from exactly this: you're coding from vibes — from intuition and aesthetic
            sense — rather than from formal specifications. It's closer to designing than engineering.
          </p>
          <blockquote className="border-l-4 border-border pl-5 italic text-muted-foreground my-6">
            "Vibe coding is what happens when the cost of writing code drops to zero. The bottleneck
            becomes taste, not typing."
          </blockquote>
        </section>

        {/* Tools */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Tools vibe coders use
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                name: "Cursor",
                desc: "AI-native code editor. Understands your entire codebase, not just the current file.",
                tag: "Editor",
              },
              {
                name: "Claude (Anthropic)",
                desc: "Best for complex reasoning about code architecture and tricky debugging sessions.",
                tag: "AI Model",
              },
              {
                name: "v0 by Vercel",
                desc: "Describe a UI in natural language, get production-ready React + Tailwind code.",
                tag: "UI Generation",
              },
              {
                name: "Bolt.new",
                desc: "Full-stack app generation in the browser. Go from prompt to deployed app in minutes.",
                tag: "Full Stack",
              },
              {
                name: "Lovable",
                desc: "AI builds your entire frontend. Connect to Supabase for a full product without writing code.",
                tag: "Full Stack",
              },
              {
                name: "Convex",
                desc: "Real-time backend that pairs beautifully with AI-generated frontends. No SQL, no API routes.",
                tag: "Backend",
              },
            ].map(({ name, desc, tag }) => (
              <div key={name} className="p-4 rounded-lg border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-sm">{name}</h3>
                  <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                    {tag}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            A typical vibe coding workflow
          </h2>
          <ol className="space-y-4">
            {[
              {
                n: "1",
                title: "Start with a vibe, not a spec",
                desc: 'Open a chat with Claude. Describe the feeling of the product: "I want to build a minimal habit tracker that feels like a Moleskine notebook." Generate the initial scaffold.',
              },
              {
                n: "2",
                title: "Let the AI write the boilerplate",
                desc: "Use Cursor or Bolt to generate auth, routing, database schema, and UI components. Don't touch the boring parts — let AI handle them.",
              },
              {
                n: "3",
                title: "Iterate on feel",
                desc: 'Run the app. Does it feel right? Adjust: "Make the spacing tighter. Change this button to use an outline style. Add a subtle fade animation." Repeat.',
              },
              {
                n: "4",
                title: "Ship fast, fix later",
                desc: "Deploy to Vercel or Netlify. Share with 10 real users. Collect feedback. Iterate again. The goal is to get something real in front of real people, not to build something perfect.",
              },
            ].map(({ n, title, desc }) => (
              <li key={n} className="flex gap-5 p-4 rounded-lg border border-border bg-card">
                <span className="text-primary font-mono font-bold shrink-0 mt-0.5">{n}.</span>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Vibe coding FAQs
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Do I need to know how to code to vibe code?",
                a: "Not necessarily. Many successful vibe coders have minimal traditional programming experience. However, knowing enough to read and debug AI-generated code significantly speeds up the process and prevents you from getting stuck on errors.",
              },
              {
                q: "Is vibe coding reliable for production apps?",
                a: "It depends on the scope. Vibe coding excels at MVPs, side projects, and internal tools. For large-scale systems requiring strict security, performance, or compliance, traditional engineering practices are still needed. Many founders vibe code to product-market fit, then hire engineers to productionize.",
              },
              {
                q: "Where can I discover apps built with vibe coding?",
                a: "Shipgrid is one of the best places — builders submit their projects directly, and many are built using AI coding tools. You can filter by tags like 'AI' or 'developer tools' to find vibe-coded products.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group rounded-lg border border-border bg-card">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-foreground text-sm">
                  {q}
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">↓</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Discover vibe coded apps CTA */}
        <section className="space-y-4 p-6 rounded-xl border border-primary/20 bg-primary/5 text-center">
          <h2 className="text-xl font-bold text-foreground">
            Discover apps built by vibe coders
          </h2>
          <p className="text-sm text-muted-foreground">
            Shipgrid is where the AI builder community ships their work. Browse apps built with
            Cursor, Claude, Bolt, and more.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/tag/ai-tools"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Browse AI tools →
            </Link>
            <Link
              href="/submit"
              className="inline-flex items-center px-4 py-2 border border-border bg-card text-foreground rounded-md font-medium text-sm hover:bg-muted transition-colors"
            >
              Submit your app
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
