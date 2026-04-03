import React from "react";
import { Metadata } from "next";
import { api } from "../../../../../convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftRight, Check, X, ChevronRight, Zap } from "lucide-react";

interface ComparePageProps {
  params: {
    slugs: string;
  };
}

export async function generateMetadata({ params }: ComparePageProps): Promise<Metadata> {
  const [slugA, slugB] = params.slugs.split("-vs-");
  if (!slugA || !slugB) return { title: "Comparison Error" };

  const [storyA, storyB] = await Promise.all([
    fetchQuery(api.stories.getBySlug, { slug: slugA }),
    fetchQuery(api.stories.getBySlug, { slug: slugB }),
  ]);

  if (!storyA || !storyB) return { title: "Comparison - Shipgrid" };

  return {
    title: `${storyA.title} vs ${storyB.title} - Comparison | Shipgrid`,
    description: `Compare ${storyA.title} and ${storyB.title} features, pricing, and use cases. Find the best tool for your workflow on Shipgrid.`,
    openGraph: {
      title: `${storyA.title} vs ${storyB.title}`,
      images: storyA.screenshotUrl ? [storyA.screenshotUrl] : [],
    },
  };
}

export default async function ComparePage({ params }: ComparePageProps) {
  const [slugA, slugB] = params.slugs.split("-vs-");
  if (!slugA || !slugB) notFound();

  const [storyA, storyB] = await Promise.all([
    fetchQuery(api.stories.getBySlug, { slug: slugA }),
    fetchQuery(api.stories.getBySlug, { slug: slugB }),
  ]);

  if (!storyA || !storyB) notFound();

  const comparisonPoints = [
    { label: "Description", a: storyA.description, b: storyB.description },
    { label: "Target Audience", a: storyA.icpRoles?.join(", ") || "Founders", b: storyB.icpRoles?.join(", ") || "Founders" },
    { label: "Problem Solved", a: storyA.icpProblem || "General utility", b: storyB.icpProblem || "General utility" },
    { label: "Votes", a: storyA.votes, b: storyB.votes },
    { label: "Rating", a: storyA.ratingCount > 0 ? (storyA.ratingSum / storyA.ratingCount).toFixed(1) : "N/A", b: storyB.ratingCount > 0 ? (storyB.ratingSum / storyB.ratingCount).toFixed(1) : "N/A" },
  ];

  return (
    <main className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-6">
          <ArrowLeftRight className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          {storyA.title} <span className="text-muted-foreground font-normal mx-4">vs</span> {storyB.title}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          In-depth comparison of two top-tier solutions launched on Shipgrid.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* Story A Card */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center">
          <img src={storyA.screenshotUrl || "/placeholder.png"} className="w-full h-40 object-cover rounded-lg mb-6 border border-border" />
          <h2 className="text-2xl font-bold mb-2">{storyA.title}</h2>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{storyA.description}</p>
          <Link href={`/s/${storyA.slug}`} className="mt-auto px-4 py-2 bg-foreground text-background rounded-md text-sm font-medium">View Project</Link>
        </div>

        {/* VS Divider */}
        <div className="hidden md:flex flex-col items-center justify-center relative">
          <div className="w-px h-full bg-border absolute left-1/2 -translate-x-1/2"></div>
          <div className="bg-background z-10 p-4 border border-border rounded-full text-xl font-bold shadow-xl">VS</div>
        </div>

        {/* Story B Card */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center">
          <img src={storyB.screenshotUrl || "/placeholder.png"} className="w-full h-40 object-cover rounded-lg mb-6 border border-border" />
          <h2 className="text-2xl font-bold mb-2">{storyB.title}</h2>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{storyB.description}</p>
          <Link href={`/s/${storyB.slug}`} className="mt-auto px-4 py-2 bg-foreground text-background rounded-md text-sm font-medium">View Project</Link>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="py-4 px-6 text-left text-sm font-semibold">Features & Stats</th>
              <th className="py-4 px-6 text-left text-sm font-semibold">{storyA.title}</th>
              <th className="py-4 px-6 text-left text-sm font-semibold">{storyB.title}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {comparisonPoints.map((point, i) => (
              <tr key={i} className="hover:bg-muted/20 transition-colors">
                <td className="py-4 px-6 text-sm font-medium text-muted-foreground">{point.label}</td>
                <td className="py-4 px-6 text-sm text-foreground">{point.a}</td>
                <td className="py-4 px-6 text-sm text-foreground">{point.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Intelligence / GEO Highlights */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-blue-900">Why choose {storyA.title}?</h3>
          </div>
          <p className="text-blue-800/80 leading-relaxed">
            {storyA.title} excels in {storyA.tags?.[0]?.name || "general features"}. 
            {storyA.icpProblem && ` It directly addresses ${storyA.icpProblem.toLowerCase()}.`}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-bold text-purple-900">Why choose {storyB.title}?</h3>
          </div>
          <p className="text-purple-800/80 leading-relaxed">
            {storyB.title} is a strong choice for {storyB.tags?.[0]?.name || "alternative needs"}.
            {storyB.icpProblem && ` If you face ${storyB.icpProblem.toLowerCase()}, this might be the better fit.`}
          </p>
        </div>
      </div>
    </main>
  );
}
