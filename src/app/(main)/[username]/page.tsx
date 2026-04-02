import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import UserProfileWrapper from "./UserProfileWrapper";

export const dynamic = "force-dynamic";


const SITE_URL = "https://shipgrid.io";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  let profileData: any = null;
  try {
    profileData = await fetchQuery(api.users.getUserProfileByUsername, {
      username,
    });
  } catch {
    // fallback
  }

  const user = profileData?.user;
  const displayName = user?.name || username;
  const bio = user?.bio;
  const title = `${displayName} (@${username}) — Shipgrid Builder`;
  const description =
    bio ||
    `${displayName} is a builder on Shipgrid. See their apps, projects, and community activity.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${username}`,
      siteName: "Shipgrid",
      type: "profile",
      ...(user?.imageUrl && {
        images: [{ url: user.imageUrl, width: 400, height: 400, alt: displayName }],
      }),
    },
    twitter: {
      card: "summary",
      title,
      description,
      site: "@shipgrid",
      ...(user?.imageUrl && { images: [user.imageUrl] }),
    },
    alternates: {
      canonical: `${SITE_URL}/${username}`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function UserProfileRoute({ params }: Props) {
  const { username } = await params;

  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: username,
      url: `${SITE_URL}/${username}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(profileJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <UserProfileWrapper username={username} />
    </>
  );
}
