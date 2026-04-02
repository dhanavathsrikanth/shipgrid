import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import TagPageWrapper from "./TagPageWrapper";

const SITE_URL = "https://shipgrid.io";

type Props = {
  params: Promise<{ tagSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tagSlug } = await params;

  let tag: any = null;
  try {
    tag = await fetchQuery(api.tags.getBySlug, { slug: tagSlug });
  } catch {
    // fallback
  }

  const tagName = tag?.name || tagSlug.replace(/-/g, " ");
  const title = `${tagName} Apps & Tools — Shipgrid`;
  const description = `Discover the best ${tagName} apps and tools submitted by builders on Shipgrid. Community-curated and AI-matched product discovery.`;

  return {
    title,
    description,
    keywords: `${tagName}, ${tagName} tools, ${tagName} apps, builder community, Shipgrid`,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/tag/${tagSlug}`,
      siteName: "Shipgrid",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
      site: "@shipgrid",
    },
    alternates: {
      canonical: `${SITE_URL}/tag/${tagSlug}`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function TagRoute({ params }: Props) {
  const { tagSlug } = await params;

  // JSON-LD breadcrumb for tag pages
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Shipgrid", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: tagSlug.replace(/-/g, " "),
        item: `${SITE_URL}/tag/${tagSlug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <TagPageWrapper tagSlug={tagSlug} />
    </>
  );
}
