import React from "react";
import { Metadata } from "next";
import { api } from "../../../../../../convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/Markdown";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface FAQPageProps {
  params: {
    storySlug: string;
  };
}

export async function generateMetadata({ params }: FAQPageProps): Promise<Metadata> {
  const story = await fetchQuery(api.stories.getBySlug, { slug: params.storySlug });

  if (!story) {
    return {
      title: "Story Not Found",
    };
  }

  return {
    title: `Frequently Asked Questions - ${story.title} | Shipgrid`,
    description: `Common questions and answers about ${story.title}. Learn more about features, building process, and more on Shipgrid.`,
    alternates: {
      canonical: `/s/${params.storySlug}/faq`,
    },
    openGraph: {
      title: `FAQ: ${story.title}`,
      description: `Detailed FAQs for ${story.title}`,
      images: story.screenshotUrl ? [story.screenshotUrl] : [],
    },
  };
}

export default async function FAQPage({ params }: FAQPageProps) {
  const story = await fetchQuery(api.stories.getBySlug, { slug: params.storySlug });

  if (!story || !story.faqs || story.faqs.length === 0) {
    // If no FAQs, let's still show the page but maybe a message, or just 404
    // Usually, we want to show the page if it's indexed.
    if (!story) notFound();
  }

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <Link 
        href={`/s/${params.storySlug}`}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Project
      </Link>

      <div className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">
          {story.title} - FAQs
        </h1>
        <p className="text-xl text-muted-foreground">
          Everything you need to know about {story.title}.
        </p>
      </div>

      <div className="space-y-8">
        {story.faqs && story.faqs.length > 0 ? (
          story.faqs.map((faq: { question: string; answer: string }, index: number) => (
            <section key={index} className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-3 flex gap-3">
                <span className="text-primary opacity-50">Q:</span>
                {faq.question}
              </h2>
              <div className="text-muted-foreground leading-relaxed pl-8">
                {faq.answer}
              </div>
            </section>
          ))
        ) : (
          <div className="bg-muted/30 border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
            No FAQs available for this project yet.
          </div>
        )}
      </div>

      <div className="mt-16 pt-8 border-t border-border text-center">
        <h3 className="text-lg font-medium mb-4">Want to learn more about {story.title}?</h3>
        <Link 
          href={`/s/${params.storySlug}`}
          className="inline-flex items-center justify-center rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-muted-foreground transition-colors"
        >
          View Project Details
        </Link>
      </div>

      {/* Structured Data for Google/SGE */}
      {story.faqs && story.faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": story.faqs.map((faq: { question: string; answer: string }) => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer
                }
              }))
            })
          }}
        />
      )}
    </main>
  );
}
