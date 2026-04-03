"use client";

import { use } from "react";
import PublicJudgingResultsPage from "@/views/PublicJudgingResultsPage";

export default function PublicJudgingResultsRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <PublicJudgingResultsPage slug={slug} />;
}
