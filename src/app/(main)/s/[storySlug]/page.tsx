import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { StoryDetail } from "@/components/StoryDetail";
import type { Story } from "@/types";

export const dynamic = "force-dynamic";

const SITE_URL = "https://shipgrid.io";


type Props = {
  params: Promise<{ storySlug: string }>;
};

// ─── Server-side Metadata (Google + AI Search) ───────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storySlug } = await params;

  let story: any = null;
  try {
    story = await fetchQuery(api.stories.getBySlug, { slug: storySlug });
  } catch {
    // silent fail — fallback below
  }

  if (!story) {
    return {
      title: "App Not Found | Shipgrid",
      description: "This app could not be found on Shipgrid.",
    };
  }

  const title = `${story.title} — Discover on Shipgrid`;
  const description =
    story.description?.slice(0, 155) ||
    `${story.title} is a product listed on Shipgrid, the AI-matched builder community.`;

  const ogImageUrl = story.screenshotUrl
    ? story.screenshotUrl
    : `${SITE_URL}/api/og?title=${encodeURIComponent(story.title)}&desc=${encodeURIComponent(story.description || "")}&votes=${story.votes || 0}`;

  return {
    title,
    description,
    keywords: [
      story.title,
      ...(story.tags?.map((t: any) => t.name) || []),
      "Shipgrid",
      "product discovery",
      "builder community",
      "indie apps",
    ].join(", "),
    authors: story.authorName ? [{ name: story.authorName }] : undefined,
    openGraph: {
      title: story.title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: story.title }],
      url: `${SITE_URL}/s/${story.slug}`,
      type: "website",
      siteName: "Shipgrid",
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description,
      images: [ogImageUrl],
      site: "@shipgrid",
    },
    alternates: {
      canonical: `${SITE_URL}/s/${story.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

// ─── Page Component (Server Component) ───────────────────────────────────────
export default async function StoryPage({ params }: Props) {
  const { storySlug } = await params;

  let story: any = null;
  try {
    story = await fetchQuery(api.stories.getBySlug, { slug: storySlug });
  } catch {
    // silent fail
  }

  if (!story) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        App not found or not yet approved.
      </div>
    );
  }

  // ─── JSON-LD: SoftwareApplication (Rich Results for search engines) ───────
  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: story.title,
    description: story.longDescription || story.description,
    url: story.url,
    applicationCategory: "WebApplication",
    operatingSystem: "Web",
    ...(story.screenshotUrl && { image: story.screenshotUrl }),
    ...(story.ratingCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (story.ratingSum / story.ratingCount).toFixed(1),
        ratingCount: story.ratingCount,
        bestRating: "5",
        worstRating: "1",
      },
    }),
    ...(story.authorName && {
      author: {
        "@type": "Person",
        name: story.authorName,
        ...(story.authorUsername && {
          url: `${SITE_URL}/${story.authorUsername}`,
        }),
      },
    }),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/OnlineOnly",
    },
    ...(story.tags?.length > 0 && {
      keywords: story.tags.map((t: any) => t.name).join(", "),
    }),
  };

  // ─── JSON-LD: FAQPage (GEO gold — appears in Google AI Overviews & Perplexity)
  const faqJsonLd =
    story.faqs && story.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: story.faqs.map((faq: any) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null;

  // ─── JSON-LD: BreadcrumbList (helps Google understand site structure) ──────
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Shipgrid",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: story.title,
        item: `${SITE_URL}/s/${story.slug}`,
      },
    ],
  };

  return (
    <>
      {/* Structured Data for Search Engines + AI Crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareAppJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* Client component handles all interactive bits (voting, comments, etc) */}
      <StoryDetailWrapper story={story as Story} />
    </>
  );
}

// ─── Thin client wrapper — keeps the interactive parts hydrating correctly ───
import StoryDetailWrapper from "./StoryDetailWrapper";
