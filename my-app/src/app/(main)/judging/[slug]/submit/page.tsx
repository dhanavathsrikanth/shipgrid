"use client";

import { use } from "react";
import { JudgingGroupSubmitPage } from "@/views/JudgingGroupSubmitPage";

export default function JudgingGroupSubmitRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <JudgingGroupSubmitPage slug={slug} />;
}
