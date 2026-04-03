"use client";

import { StoryDetail } from "@/components/StoryDetail";
import type { Story } from "@/types";

export default function StoryDetailWrapper({ story }: { story: Story }) {
  return <StoryDetail story={story} />;
}
