import { MetadataRoute } from "next";

const SITE_URL = "https://shipgrid.io";

// Static routes always present
const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: SITE_URL,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    url: `${SITE_URL}/explore`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    url: `${SITE_URL}/leaderboard`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    url: `${SITE_URL}/submit`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  },
  // Content pages — high priority for GEO & SEO
  {
    url: `${SITE_URL}/about`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    url: `${SITE_URL}/blog`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/blog/what-is-vibe-coding`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    url: `${SITE_URL}/blog/where-to-share-side-project`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.85,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all published stories via Convex HTTP API
  // We use the Convex REST API since this runs on the server during build/ISR
  let storyRoutes: MetadataRoute.Sitemap = [];
  let tagRoutes: MetadataRoute.Sitemap = [];

  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (convexUrl) {
      // Fetch approved stories for sitemap
      const storiesRes = await fetch(
        `${convexUrl.replace(".cloud", ".site")}/api/stories/listForSitemap`,
        {
          method: "GET",
          next: { revalidate: 3600 }, // revalidate every hour
        }
      );

      if (storiesRes.ok) {
        const stories = await storiesRes.json();
        storyRoutes = (Array.isArray(stories) ? stories : []).map((s: any) => ({
          url: `${SITE_URL}/s/${s.slug}`,
          lastModified: new Date(s._creationTime),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }));
      }
    }
  } catch {
    // Sitemap still works with just static routes if API fetch fails
  }

  return [...staticRoutes, ...storyRoutes, ...tagRoutes];
}
