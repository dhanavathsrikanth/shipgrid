import type { Metadata } from "next";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { PostHogProvider } from "./providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@/index.css";

export const dynamic = "force-dynamic";

// ─── Global JSON-LD (WebSite + Organization) ─────────────────────────────────
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Shipgrid",
  url: "https://goshipgrid.app",
  description:
    "Shipgrid is an AI-matched product discovery platform where builders showcase their apps and buyers find exactly what they need — matched by role, problem, and budget.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://goshipgrid.app/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Shipgrid",
  url: "https://goshipgrid.app",
  logo: "https://goshipgrid.app/favicon-196x196.png",
  description:
    "AI-matched product discovery platform for builders and indie founders.",
  sameAs: [
    "https://twitter.com/shipgrid",
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Shipgrid — AI-Matched Product Discovery for Builders",
    template: "%s | Shipgrid",
  },
  description:
    "Discover and ship apps on Shipgrid — the builder community with AI-matched product discovery. Find tools tailored to your role, problem, and budget.",
  keywords:
    "product discovery, indie apps, builder community, ship, vibe coding, AI tools, SaaS, startups, developers, founder tools, Shipgrid",
  authors: [{ name: "Shipgrid" }],
  metadataBase: new URL("https://goshipgrid.app"),
  openGraph: {
    title: "Shipgrid — AI-Matched Product Discovery for Builders",
    description: "Discover apps matched to you. Ship to the right audience.",
    images: ["https://goshipgrid.app/vibe-apps-open-graphi-image.png"],
    url: "https://goshipgrid.app",
    type: "website",
    siteName: "Shipgrid",
  },
  twitter: {
    card: "summary_large_image",
    site: "@shipgrid",
    creator: "@shipgrid",
    title: "Shipgrid — AI-Matched Product Discovery",
    description:
      "Where builders ship and buyers discover exactly what they need.",
    images: ["https://goshipgrid.app/vibe-apps-open-graphi-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-128.png", sizes: "128x128", type: "image/png" },
      { url: "/favicon-196x196.png", sizes: "196x196", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon-57x57.png", sizes: "57x57" },
      { url: "/apple-touch-icon-60x60.png", sizes: "60x60" },
      { url: "/apple-touch-icon-72x72.png", sizes: "72x72" },
      { url: "/apple-touch-icon-76x76.png", sizes: "76x76" },
      { url: "/apple-touch-icon-114x114.png", sizes: "114x114" },
      { url: "/apple-touch-icon-120x120.png", sizes: "120x120" },
      { url: "/apple-touch-icon-144x144.png", sizes: "144x144" },
      { url: "/apple-touch-icon-152x152.png", sizes: "152x152" },
    ],
  },
  other: {
    "application-name": " ",
    "msapplication-TileColor": "hsl(var(--background))",
    "msapplication-TileImage": "/mstile-144x144.png",
  },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://stijndv.com" />
        <link
          rel="stylesheet"
          href="https://stijndv.com/fonts/Eudoxus-Sans.css"
        />
      </head>
      <body>
        {/* Global Structured Data for Google Knowledge Graph + AI Engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <PostHogProvider>
          <ClerkProvider
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
          >
            <ConvexClientProvider>
              {children}
            </ConvexClientProvider>
          </ClerkProvider>
        </PostHogProvider>
        <Script
          src="https://app.rybbit.io/api/script.js"
          data-site-id="656"
          strategy="afterInteractive"
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
