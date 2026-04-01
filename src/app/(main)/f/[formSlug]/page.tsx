"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PublicForm } from "@/components/PublicForm";

export default function PublicFormPage({
  params,
}: {
  params: Promise<{ formSlug: string }>;
}) {
  const { formSlug } = use(params);

  const formWithFields = useQuery(
    api.forms.getFormBySlug,
    formSlug ? { slug: formSlug } : "skip",
  );

  if (formWithFields === undefined) {
    return <div>Loading form...</div>;
  }
  if (formWithFields === null) {
    return <div>Form not found or not public.</div>;
  }

  return <PublicForm form={formWithFields} fields={formWithFields.fields} />;
}
