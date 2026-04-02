"use client";

import { TagPage } from "@/views/TagPage";

export default function TagPageWrapper({ tagSlug }: { tagSlug: string }) {
  return <TagPage tagSlug={tagSlug} />;
}
