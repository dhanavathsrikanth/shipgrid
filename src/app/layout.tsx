import type { Metadata } from "next";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "@/index.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "Vibe Apps - The community where you go to show off what you've built, and see what others are building.",
  description:
    "Discover and share apps and see what others are building. Powered by Convex.",
  keywords:
    "vibe, vibe coding, app, hackathons, hackathon apps, startups, developers,convex hackathon, vibe coding apps, dev mode, community, vibeapps.dev, ship, build, directory, product launches",
  authors: [{ name: "Vibe Apps" }],
  openGraph: {
    title: "Vibe Apps",
    description: "The place to share and discover new apps.",
    images: ["https://vibeapps.dev/vibe-apps-open-graphi-image.png"],
    url: "https://vibeapps.dev",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@waynesutton",
    creator: "@waynesutton",
    title: "Vibe Apps",
    description:
      "The place to share and discover new apps and see what others are building.",
    images: ["https://vibeapps.dev/vibe-apps-open-graphi-image.png"],
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
}: {
  children: React.ReactNode;
}) {
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
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
        >
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </ClerkProvider>
        <Script
          src="https://app.rybbit.io/api/script.js"
          data-site-id="656"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
