"use client";

import { use } from "react";
import { PublicResultsViewer } from "@/components/PublicResultsViewer";

export default function ResultsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <PublicResultsViewer slug={slug} />;
}
