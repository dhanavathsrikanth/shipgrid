"use client";

import { use } from "react";
import JudgingGroupPage from "@/views/JudgingGroupPage";

export default function JudgingGroupRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <JudgingGroupPage slug={slug} />;
}
