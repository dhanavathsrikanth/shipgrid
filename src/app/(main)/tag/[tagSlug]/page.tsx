"use client";

import { use } from "react";
import { TagPage } from "@/views/TagPage";

export default function TagRoute({
  params,
}: {
  params: Promise<{ tagSlug: string }>;
}) {
  const { tagSlug } = use(params);
  return <TagPage tagSlug={tagSlug} />;
}
