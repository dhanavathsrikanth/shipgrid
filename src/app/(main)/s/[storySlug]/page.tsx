"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { StoryDetail } from "@/components/StoryDetail";
import type { Story } from "@/types";

export default function StoryPage({
  params,
}: {
  params: Promise<{ storySlug: string }>;
}) {
  const { storySlug } = use(params);

  const story = useQuery(
    api.stories.getBySlug,
    storySlug ? { slug: storySlug } : "skip",
  );

  if (story === undefined) {
    return <div>Loading story...</div>;
  }
  if (story === null) {
    return <div>App not found or not approved.</div>;
  }

  return <StoryDetail story={story as Story} />;
}
