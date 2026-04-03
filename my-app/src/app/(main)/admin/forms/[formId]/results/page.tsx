"use client";

import { use } from "react";
import { FormResults } from "@/components/admin/FormResults";

export default function FormResultsPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = use(params);
  return <FormResults formId={formId} />;
}
