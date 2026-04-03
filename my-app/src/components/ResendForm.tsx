"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { Github, Plus, X } from "lucide-react";
import { SignUpButton } from "@clerk/nextjs";

interface Tag extends Doc<"tags"> {
  // Inherits _id, _creationTime, name, showInHeader, isHidden?, backgroundColor?, textColor?
}

export function ResendForm() {
  const router = useRouter();
  const [selectedTagIds, setSelectedTagIds] = React.useState<Id<"tags">[]>([]);
  const [newTagInputValue, setNewTagInputValue] = React.useState("");
  const [newTagNames, setNewTagNames] = React.useState<string[]>([]);
  const [formData, setFormData] = React.useState({
    title: "",
    tagline: "",
    longDescription: "",
    submitterName: "",
    url: "",
    videoUrl: "",
    email: "",
    image: null as File | null,
  });

  const [dynamicFormData, setDynamicFormData] = React.useState<
    Record<string, string>
  >({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);

  const MAX_TAGLINE_LENGTH = 140;

  const availableTags = useQuery(api.tags.listHeader);
  const formFields = useQuery(api.storyFormFields.listEnabled);
  const settings = useQuery(api.settings.get);

  const generateUploadUrl = useMutation(api.stories.generateUploadUrl);
  const submitStoryAnonymous = useMutation(api.stories.submitAnonymous);

  const handleAddNewTag = () => {
    const tagName = newTagInputValue.trim();
    if (
      tagName &&
      !newTagNames.some((t) => t.toLowerCase() === tagName.toLowerCase()) &&
      !availableTags?.some(
        (t) => t.name.toLowerCase() === tagName.toLowerCase(),
      )
    ) {
      setNewTagNames((prev) => [...prev, tagName]);
      setNewTagInputValue("");
      setSubmitError(null);
    } else if (tagName) {
      setSubmitError("Tag name already exists or is invalid.");
    }
  };

  const handleRemoveNewTag = (tagName: string) => {
    setNewTagNames((prev) => prev.filter((t) => t !== tagName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalTagsSelected = selectedTagIds.length + newTagNames.length;
    if (isSubmitting || totalTagsSelected === 0) {
      if (totalTagsSelected === 0) {
        setSubmitError("Please select or add at least one tag.");
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setShowSuccessMessage(false);

    try {
      let screenshotId: Id<"_storage"> | undefined = undefined;

      if (formData.image) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": formData.image.type },
          body: formData.image,
        });
        const { storageId } = await result.json();
        if (!storageId) {
          throw new Error("Failed to get storage ID after upload.");
        }
        screenshotId = storageId;
      }

      await submitStoryAnonymous({
        title: formData.title,
        tagline: formData.tagline,
        longDescription: formData.longDescription || undefined,
        submitterName: formData.submitterName,
        url: formData.url,
        videoUrl: formData.videoUrl || undefined,
        email: formData.email,
        tagIds: selectedTagIds,
        newTagNames: [...newTagNames, "resendhackathon"], // Auto-add hidden tracking tag
        screenshotId: screenshotId,
        linkedinUrl: dynamicFormData.linkedinUrl || undefined,
        twitterUrl: dynamicFormData.twitterUrl || undefined,
        githubUrl: dynamicFormData.githubUrl || undefined,
        chefShowUrl: dynamicFormData.chefShowUrl || undefined,
        chefAppUrl: dynamicFormData.chefAppUrl || undefined,
      });

      setShowSuccessMessage(true);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Failed to submit story:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "An unknown error occurred during submission.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tagId: Id<"tags">) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError("Screenshot file size should not exceed 5MB.");
        e.target.value = "";
        setFormData((prev) => ({ ...prev, image: null }));
      } else {
        setSubmitError(null);
        setFormData((prev) => ({ ...prev, image: file }));
      }
    } else {
      setFormData((prev) => ({ ...prev, image: null }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground inline-block mb-6"
      >
        ← Back to Apps
      </Link>

      <div className="bg-card p-6 rounded-lg border border-border">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            <a
              href="https://www.convex.dev/hackathons/resend"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors underline"
            >
              Convex & Resend Hackathon
            </a>{" "}
            submission form is now closed
          </h2>
          <p className="text-muted-foreground">
            Thank you to everyone who participated!
          </p>
        </div>

        {false && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">
              Convex & Resend Hackathon Submissions
            </h2>{" "}
            <span className="ml-2 text-sm font-bold text-destructive">
              <SignUpButton mode="modal">
                <button type="button" className="underline hover:no-underline">
                  Sign up
                </button>
              </SignUpButton>{" "}
              to edit your submission after it's been submitted.
            </span>{" "}
            <p className="ml-2 text-md font-bold text-muted-foreground">
              What did you build?
            </p>
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                App Title *
              </label>
              <input
                type="text"
                id="title"
                placeholder="Site name"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 bg-card rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label
                htmlFor="tagline"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                App/Project Tagline*
              </label>
              <input
                type="text"
                id="tagline"
                placeholder="One sentence pitch or description"
                value={formData.tagline}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_TAGLINE_LENGTH) {
                    setFormData((prev) => ({
                      ...prev,
                      tagline: e.target.value,
                    }));
                  }
                }}
                maxLength={MAX_TAGLINE_LENGTH}
                className="w-full px-3 py-2 bg-card rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border"
                required
                disabled={isSubmitting}
              />
              <div className="text-xs text-right text-muted-foreground mt-1">
                {formData.tagline.length}/{MAX_TAGLINE_LENGTH}
              </div>
            </div>
            <div>
              <label
                htmlFor="longDescription"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Description (Optional)
              </label>
              <textarea
                id="longDescription"
                placeholder="- What it does&#10;- Key Features&#10;- How you built it&#10;- How are you using Resend"
                value={formData.longDescription}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    longDescription: e.target.value,
                  }))
                }
                rows={4}
                className="w-full px-3 py-2 bg-card rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                App Website Link *
              </label>
              <div className="text-sm text-muted-foreground mb-2">
                Enter your app url (ex: https://)
              </div>
              <input
                type="url"
                id="url"
                placeholder="https://"
                value={formData.url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, url: e.target.value }))
                }
                className="w-full px-3 py-2 bg-card rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label
                htmlFor="videoUrl"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Video Demo - 3-5 minutes recommended (Optional)
              </label>
              <div className="text-sm text-muted-foreground mb-2">
                Share a video demo of your app (YouTube, Vimeo, etc.)
              </div>
              <input
                type="url"
                id="videoUrl"
                placeholder="https://youtube.com/.."
                value={formData.videoUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, videoUrl: e.target.value }))
                }
                className="w-full px-3 py-2 bg-card rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label
                htmlFor="submitterName"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Your Name *
              </label>
              <input
                type="text"
                id="submitterName"
                placeholder="Your name"
                value={formData.submitterName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    submitterName: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-card rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Email *
              </label>
              <div className="text-sm text-muted-foreground mb-2">
                Required for anonymous submissions (used for communication only)
              </div>
              <input
                type="email"
                id="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-3 py-2 bg-card rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label
                htmlFor="image"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Upload Screenshot (Recommended but Optional)
              </label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 bg-card rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-muted file:text-muted-foreground hover:file:bg-muted-foreground/10"
                disabled={isSubmitting}
              />
              {formData.image && (
                <div className="text-sm text-muted-foreground mt-1">
                  Selected: {formData.image?.name}
                </div>
              )}
            </div>
            {/* Dynamic Form Fields */}
            {formFields?.map((field) => (
              <div key={field.key}>
                <label
                  htmlFor={field.key}
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  {field.label}
                </label>
                {field.description && (
                  <div className="text-sm text-muted-foreground mb-2">
                    {field.description}
                  </div>
                )}
                <input
                  type={field.fieldType}
                  id={field.key}
                  placeholder={field.placeholder}
                  value={dynamicFormData[field.key] || ""}
                  onChange={(e) =>
                    setDynamicFormData((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-card rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border"
                  required={field.isRequired}
                  disabled={isSubmitting}
                />
              </div>
            ))}
            {formFields === undefined && (
              <div className="text-sm text-muted-foreground">
                Loading form fields...
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Select Tags *
              </label>{" "}
              <span className="ml-2 text-xs text-muted-foreground">
                What apps did you use?
              </span>
              <div className="flex flex-wrap gap-2 mb-4">
                {availableTags === undefined && (
                  <span className="text-sm text-gray-500">Loading tags...</span>
                )}
                {availableTags
                  ?.filter((tag: Tag) => tag.name !== "resendhackathon")
                  .map((tag: Tag) => (
                    <button
                      key={tag._id}
                      type="button"
                      onClick={() => toggleTag(tag._id)}
                      className={`px-3 py-1 rounded-md text-sm transition-colors border ${selectedTagIds.includes(tag._id) ? "bg-muted text-foreground border-border" : "bg-card text-muted-foreground border-border hover:border-muted-foreground/30 hover:text-foreground"}`}
                    >
                      {tag.name}
                    </button>
                  ))}
              </div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Add New Tags (optional)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTagInputValue}
                  onChange={(e) => setNewTagInputValue(e.target.value)}
                  placeholder="Enter new tag name..."
                  className="flex-1 px-3 py-2 bg-card rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border text-sm"
                  disabled={isSubmitting}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddNewTag();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddNewTag}
                  disabled={!newTagInputValue.trim() || isSubmitting}
                  className="px-3 py-1 bg-muted text-foreground rounded-md hover:bg-muted-foreground/10 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {newTagNames.map((tagName) => (
                  <span
                    key={tagName}
                    className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm border border-primary/20"
                  >
                    {tagName}
                    <button
                      type="button"
                      onClick={() => handleRemoveNewTag(tagName)}
                      disabled={isSubmitting}
                      className="text-primary hover:text-primary/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              {selectedTagIds.length === 0 && newTagNames.length === 0 && (
                <p className="text-xs text-destructive mt-1">
                  Please select or add at least one tag.
                </p>
              )}
            </div>
            <hr
              className="my-4 border-t border-border w-full"
              style={{ paddingBottom: "1rem" }}
            />
            <span className="ml-2 text-sm font-bold text-destructive">
              Please read: If you need to edit your submission after it's been
              submitted,{" "}
              <SignUpButton mode="modal">
                <button type="button" className="underline hover:no-underline">
                  Create an account
                </button>
              </SignUpButton>{" "}
              first.
            </span>{" "}
            <div className="flex gap-4 items-center pt-4 border-t border-border">
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  (selectedTagIds.length === 0 && newTagNames.length === 0) ||
                  !formData.title ||
                  !formData.tagline ||
                  formData.tagline.length > MAX_TAGLINE_LENGTH ||
                  !formData.url ||
                  !formData.submitterName ||
                  !formData.email
                }
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit App"}
              </button>
              <Link
                href="/"
                className="px-4 py-2 text-muted-foreground hover:text-foreground rounded-md text-sm"
              >
                Cancel
              </Link>
            </div>
            {settings?.showSubmissionLimit && (
              <div className="text-sm text-muted-foreground">
                You can submit up to {settings?.submissionLimitCount || 10}{" "}
                projects per day.
              </div>
            )}
            {submitError && (
              <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {submitError}
              </div>
            )}
            {showSuccessMessage && (
              <div className="mt-4 p-4 bg-primary/10 text-primary rounded-md text-sm">
                Thanks for sharing!
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}



