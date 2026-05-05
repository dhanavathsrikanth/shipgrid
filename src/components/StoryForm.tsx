"use client";

import React from "react";
import { Markdown } from "./Markdown";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { Plus, X, ChevronLeft, ChevronRight, Check, ChevronsUpDown } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { AuthRequiredDialog } from "./ui/AuthRequiredDialog";
import { MultiSelect } from "./ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Tag extends Doc<"tags"> {
  // Inherits _id, _creationTime, name, showInHeader, isHidden?, backgroundColor?, textColor?
}

export function StoryForm() {
  const router = useRouter();
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();
  const [selectedTagIds, setSelectedTagIds] = React.useState<Id<"tags">[]>([]);
  const [newTagInputValue, setNewTagInputValue] = React.useState("");
  const [newTagNames, setNewTagNames] = React.useState<string[]>([]);

  // Dropdown search state
  const [dropdownSearchValue, setDropdownSearchValue] = React.useState("");
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [formData, setFormData] = React.useState({
    title: "",
    tagline: "",
    longDescription: "",
    submitterName: "",
    url: "",
    videoUrl: "",
    email: "",
    image: null as File | null,
    // ICP Matching & Lifecycle Fields
    icpRoles: [] as string[],
    icpProblem: "",
    icpBudget: "",
    notFor: "",
    stage: "live" as "idea" | "building" | "beta" | "live",
    isOpenSource: false,
  });

  // Cascading ICP category/subcategory selection state
  const [selectedIcpCategory, setSelectedIcpCategory] = React.useState<string>("");
  const [selectedSubcategories, setSelectedSubcategories] = React.useState<string[]>([]);

  // Additional images state
  const [additionalImages, setAdditionalImages] = React.useState<File[]>([]);
  const [imageModalOpen, setImageModalOpen] = React.useState(false);
  const [imageModalImages, setImageModalImages] = React.useState<string[]>([]);
  const [imageModalCurrentIndex, setImageModalCurrentIndex] = React.useState(0);

  const [dynamicFormData, setDynamicFormData] = React.useState<
    Record<string, string>
  >({});

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);

  // Auth required dialog state
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);

  // Hackathon team info state
  const [showTeamInfo, setShowTeamInfo] = React.useState(false);
  const [teamData, setTeamData] = React.useState({
    teamName: "",
    teamMemberCount: 1,
    teamMembers: [{ name: "", email: "" }],
  });

  const [faqs, setFaqs] = React.useState<{ question: string; answer: string }[]>(
    [],
  );

  const MAX_TAGLINE_LENGTH = 140;

  const availableTags = useQuery(api.tags.list);
  const allTags = useQuery(api.tags.listAllForDropdown);
  const formFields = useQuery(api.storyFormFields.listEnabled);
  const settings = useQuery(api.settings.get);
  const icpOptions = useQuery(api.icp.getOptions);

  const generateUploadUrl = useMutation(api.stories.generateUploadUrl);
  const submitStory = useMutation(api.stories.submit);

  const handleAddNewTag = () => {
    const tagName = newTagInputValue.trim();
    const totalTags = selectedTagIds.length + newTagNames.length;

    if (totalTags >= 10) {
      setSubmitError("You can select a maximum of 10 tags.");
      return;
    }

    if (
      tagName &&
      !newTagNames.some((t: string) => t.toLowerCase() === tagName.toLowerCase()) &&
      !availableTags?.some(
        (t: Tag) => t.name.toLowerCase() === tagName.toLowerCase(),
      ) &&
      !allTags?.some((t: Tag) => t.name.toLowerCase() === tagName.toLowerCase())
    ) {
      setNewTagNames((prev) => [...prev, tagName]);
      setNewTagInputValue("");
      setSubmitError(null);
    } else if (tagName) {
      setSubmitError("Tag name already exists or is invalid.");
    }
  };

  const handleRemoveNewTag = (tagName: string) => {
    setNewTagNames((prev) => prev.filter((t: string) => t !== tagName));
  };

  const handleSelectFromDropdown = (tagId: Id<"tags">) => {
    const totalTags = selectedTagIds.length + newTagNames.length;

    if (totalTags >= 10) {
      setSubmitError("You can select a maximum of 10 tags.");
      return;
    }

    if (!selectedTagIds.includes(tagId)) {
      setSelectedTagIds((prev) => [...prev, tagId]);
    }
    setDropdownSearchValue("");
    setShowDropdown(false);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication first
    if (!isClerkLoaded) return;
    if (!isSignedIn) {
      setShowAuthDialog(true);
      return;
    }

    const totalTagsSelected = selectedTagIds.length + newTagNames.length;
    if (isSubmitting || totalTagsSelected === 0) {
      if (totalTagsSelected === 0) {
        setSubmitError("Please select or add at least one tag.");
      }
      return;
    }

    // ICP mandatory field validation
    if (formData.icpRoles.length === 0) {
      setSubmitError("Please select at least one Target Subcategory in the ICP section.");
      return;
    }
    if (!formData.icpProblem) {
      setSubmitError("Please select a Primary Pain Point in the ICP section.");
      return;
    }
    if (!formData.icpBudget) {
      setSubmitError("Please select a Target Budget Bracket in the ICP section.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setShowSuccessMessage(false);

    try {
      let screenshotId: Id<"_storage"> | undefined = undefined;
      let additionalImageIds: Id<"_storage">[] | undefined = undefined;

      // Upload main screenshot
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

      // Upload additional images
      if (additionalImages.length > 0) {
        const uploadPromises = additionalImages.map(async (file) => {
          const postUrl = await generateUploadUrl();
          const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });
          const { storageId } = await result.json();
          if (!storageId) {
            throw new Error(`Failed to get storage ID for ${file.name}`);
          }
          return storageId;
        });

        additionalImageIds = await Promise.all(uploadPromises);
      }

      await submitStory({
        title: formData.title,
        tagline: formData.tagline,
        longDescription: formData.longDescription || undefined,
        submitterName: formData.submitterName || undefined,
        url: formData.url,
        videoUrl: formData.videoUrl || undefined,
        email: formData.email || undefined,
        tagIds: selectedTagIds,
        newTagNames: newTagNames,
        screenshotId: screenshotId,
        additionalImageIds: additionalImageIds,
        linkedinUrl: dynamicFormData.linkedinUrl || undefined,
        twitterUrl: dynamicFormData.twitterUrl || undefined,
        githubUrl: dynamicFormData.githubUrl || undefined,
        chefShowUrl: dynamicFormData.chefShowUrl || undefined,
        chefAppUrl: dynamicFormData.chefAppUrl || undefined,
        // Team info (only include if team info is shown and has data)
        teamName:
          showTeamInfo && teamData.teamName ? teamData.teamName : undefined,
        teamMemberCount:
          showTeamInfo && teamData.teamName
            ? teamData.teamMemberCount
            : undefined,
        teamMembers:
          showTeamInfo && teamData.teamName
            ? teamData.teamMembers.filter(
                (member) => member.name.trim() || member.email.trim(),
              )
            : undefined,
        // ICP Matching & Lifecycle Fields
        icpRoles: formData.icpRoles,
        icpProblem: formData.icpProblem || undefined,
        icpBudget: formData.icpBudget || undefined,
        notFor: formData.notFor || undefined,
        stage: formData.stage,
        isOpenSource: formData.isOpenSource,
        faqs:
          faqs.length > 0
            ? faqs.filter((f) => f.question.trim() && f.answer.trim())
            : undefined,
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
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      } else {
        const totalTags = prev.length + newTagNames.length;
        if (totalTags >= 10) {
          setSubmitError("You can select a maximum of 10 tags.");
          return prev;
        }
        setSubmitError(null);
        return [...prev, tagId];
      }
    });
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

  const handleAdditionalImagesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError(`File ${file.name} exceeds 5MB limit.`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        setSubmitError(`File ${file.name} is not an image.`);
        continue;
      }
      validFiles.push(file);
    }

    const totalImages = additionalImages.length + validFiles.length;
    if (totalImages > 4) {
      setSubmitError("Maximum of 4 additional images allowed.");
      return;
    }

    setAdditionalImages((prev) => [...prev, ...validFiles]);
    setSubmitError(null);
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const openImageModal = (images: string[]) => {
    setImageModalImages(images);
    setImageModalCurrentIndex(0);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setImageModalImages([]);
    setImageModalCurrentIndex(0);
  };

  const navigateImageModal = (direction: "prev" | "next") => {
    setImageModalCurrentIndex((prev) => {
      if (direction === "prev") {
        return prev > 0 ? prev - 1 : imageModalImages.length - 1;
      } else {
        return prev < imageModalImages.length - 1 ? prev + 1 : 0;
      }
    });
  };

  // Keyboard navigation for image modal
  React.useEffect(() => {
    if (!imageModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          closeImageModal();
          break;
        case "ArrowLeft":
          navigateImageModal("prev");
          break;
        case "ArrowRight":
          navigateImageModal("next");
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [imageModalOpen]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".tag-dropdown-container")) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // Team info helper functions
  const handleTeamMemberCountChange = (count: number) => {
    const newCount = Math.max(1, Math.min(10, count)); // Limit between 1-10 members
    setTeamData((prev) => {
      const newMembers = [...prev.teamMembers];

      // Add new empty members if count increased
      while (newMembers.length < newCount) {
        newMembers.push({ name: "", email: "" });
      }

      // Remove members if count decreased
      if (newMembers.length > newCount) {
        newMembers.splice(newCount);
      }

      return {
        ...prev,
        teamMemberCount: newCount,
        teamMembers: newMembers,
      };
    });
  };

  const handleTeamMemberChange = (
    index: number,
    field: "name" | "email",
    value: string,
  ) => {
    setTeamData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) =>
        i === index ? { ...member, [field]: value } : member,
      ),
    }));
  };

  const handleAddFaq = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFaqChange = (
    index: number,
    field: "question" | "answer",
    value: string,
  ) => {
    setFaqs((prev) =>
      prev.map((faq, i) => (i === index ? { ...faq, [field]: value } : faq)),
    );
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground inline-block mb-6"
      >
        ← Back to Apps
      </Link>

      <div className="bg-card p-6 rounded-lg border border-border">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-xl font-medium text-foreground">
            Submit your app
          </h2>{" "}
          <span className="ml-2 text-sm text-muted-foreground">
            What did you build?
          </span>
          <div className="space-y-1.5">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-foreground"
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
              className="w-full px-3 py-2 h-10 bg-white rounded-md text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground border border-border"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="tagline"
              className="block text-sm font-medium text-foreground"
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
                  setFormData((prev) => ({ ...prev, tagline: e.target.value }));
                }
              }}
              maxLength={MAX_TAGLINE_LENGTH}
              className="w-full px-3 py-2 h-10 bg-white rounded-md text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground border border-border"
              required
              disabled={isSubmitting}
            />
            <div className="text-xs text-right text-muted-foreground mt-1">
              {formData.tagline.length}/{MAX_TAGLINE_LENGTH}
            </div>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="longDescription"
              className="block text-sm font-medium text-foreground"
            >
              Description (Markdown and fenced `code` blocks supported)
            </label>
            <textarea
              id="longDescription"
              placeholder="- Problem you're solving&#10;- How the app works&#10;- Notable features&#10;- Why did you build this&#10;- Tech stack list&#10;- Challenges we ran into&#10;- Any success stories or metrics&#10;"
              value={formData.longDescription}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  longDescription: e.target.value,
                }))
              }
              rows={8}
              className="w-full px-3 py-2 bg-white rounded-md text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground border border-border"
              disabled={isSubmitting}
            />
              {formData.longDescription && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">Preview</div>
                  <div className="prose prose-sm max-w-none text-foreground bg-muted border border-border rounded-md p-3">
                    <Markdown>{formData.longDescription}</Markdown>
                  </div>
                </div>
              )}
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="url"
              className="block text-sm font-medium text-foreground"
            >
              App Website Link *
            </label>
            <p className="text-xs text-muted-foreground">
              Enter your app url (ex: https://)
            </p>
            <input
              type="url"
              id="url"
              placeholder="https://"
              value={formData.url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
              className="w-full px-3 py-2 h-10 bg-white rounded-md text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground border border-border"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="videoUrl"
              className="block text-sm font-medium text-foreground"
            >
              Video Demo (Recommended)
            </label>
            <p className="text-xs text-muted-foreground">
              Share a video demo of your app (YouTube, Vimeo, etc.)
            </p>
            <input
              type="url"
              id="videoUrl"
              placeholder="https://youtube.com/..."
              value={formData.videoUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, videoUrl: e.target.value }))
              }
              className="w-full px-3 py-2 h-10 bg-white rounded-md text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground border border-border"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="submitterName"
              className="block text-sm font-medium text-foreground"
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
              className="w-full px-3 py-2 h-10 bg-white rounded-md text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground border border-border"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email (Optional)
            </label>
            <p className="text-xs text-muted-foreground">
              Hidden and for hackathon notifications
            </p>
            <input
              type="email"
              id="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full px-3 py-2 h-10 bg-white rounded-md text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground border border-border"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="image"
              className="block text-sm font-medium text-foreground"
            >
              Upload Screenshot (Recommended)
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 h-10 py-1 bg-white rounded-md text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground border border-border file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-muted file:text-muted-foreground hover:file:bg-[#e5e1de]"
              disabled={isSubmitting}
            />
            {formData.image && (
              <p className="text-xs text-muted-foreground">
                Selected: {formData.image.name}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="additionalImages"
              className="block text-sm font-medium text-foreground"
            >
              Additional Images (Optional)
            </label>
            <p className="text-xs text-muted-foreground">
              Upload up to 4 additional images to showcase your app
            </p>
            <input
              type="file"
              id="additionalImages"
              accept="image/*"
              multiple
              onChange={handleAdditionalImagesChange}
              className="w-full px-3 h-10 py-1 bg-white rounded-md text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground border border-border file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-muted file:text-muted-foreground hover:file:bg-[#e5e1de]"
              disabled={isSubmitting || additionalImages.length >= 4}
            />
            {additionalImages.length > 0 && (
              <div className="mt-3">
                <div className="text-sm text-muted-foreground mb-2">
                  Selected images ({additionalImages.length}/4):
                </div>
                <div className="flex flex-wrap gap-2">
                  {additionalImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-16 h-16 object-cover rounded border border-border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          const allImages = [
                            ...(formData.image
                              ? [URL.createObjectURL(formData.image)]
                              : []),
                            ...additionalImages.map((f) =>
                              URL.createObjectURL(f),
                            ),
                          ];
                          openImageModal(allImages);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeAdditionalImage(index)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-destructive/90 transition-colors"
                        disabled={isSubmitting}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {additionalImages.length >= 4 && (
              <div className="text-sm text-primary mt-1">
                Maximum of 4 additional images reached
              </div>
            )}
          </div>
          {/* GitHub URL Field - Always Shown */}
          <div className="space-y-1.5">
            <label
              htmlFor="githubUrl"
              className="block text-sm font-medium text-foreground"
            >
              GitHub Repo URL (Optional)
            </label>
            <p className="text-xs text-muted-foreground">
              GitHub repository URL for your project
            </p>
            <input
              type="url"
              id="githubUrl"
              placeholder="https://github.com/username/repository"
              value={dynamicFormData.githubUrl || ""}
              onChange={(e) =>
                setDynamicFormData((prev) => ({
                  ...prev,
                  githubUrl: e.target.value,
                }))
              }
              className="w-full px-3 h-10 py-2 bg-white rounded-md text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground border border-border"
              disabled={isSubmitting}
            />
          </div>
          {/* Dynamic Form Fields */}
          {formFields
            ?.filter((field: any) => field.key !== "githubUrl")
            .map((field: any) => (
              <div key={field.key} className="space-y-1.5">
                <label
                  htmlFor={field.key}
                  className="block text-sm font-medium text-foreground"
                >
                  {field.label}
                </label>
                {field.description && (
                  <p className="text-xs text-muted-foreground">
                    {field.description}
                  </p>
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
                  className="w-full px-3 h-10 py-2 bg-card rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border"
                  required={field.isRequired}
                  disabled={isSubmitting}
                />
              </div>
            ))}
          {formFields === undefined && (
            <div className="text-sm text-muted-foreground">Loading form fields...</div>
          )}
          {/* Hackathon Team Info Section */}
          {settings?.showHackathonTeamInfo && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setShowTeamInfo(!showTeamInfo)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span
                    className={`transform transition-transform ${showTeamInfo ? "rotate-90" : ""}`}
                  >
                    ▶
                  </span>
                  Team Info (Optional)
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Add your hackathon team information if you're participating as a
                team
              </p>

              {showTeamInfo && (
                <div className="space-y-4 p-4 bg-muted rounded-lg border border-border mb-4">
                  {/* Team Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="teamName"
                      className="block text-sm font-medium text-foreground"
                    >
                      Team Name
                    </label>
                    <input
                      type="text"
                      id="teamName"
                      placeholder="Enter your team name"
                      value={teamData.teamName}
                      onChange={(e) =>
                        setTeamData((prev) => ({
                          ...prev,
                          teamName: e.target.value,
                        }))
                      }
                      className="w-full px-3 h-10 py-2 bg-card rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Number of Team Members */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="teamMemberCount"
                      className="block text-sm font-medium text-foreground"
                    >
                      Number of Team Members
                    </label>
                    <input
                      type="number"
                      id="teamMemberCount"
                      min="1"
                      max="10"
                      value={teamData.teamMemberCount}
                      onChange={(e) =>
                        handleTeamMemberCountChange(
                          parseInt(e.target.value) || 1,
                        )
                      }
                      className="w-full px-3 h-10 py-2 bg-card rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border max-w-[120px]"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum 10 team members
                    </p>
                  </div>

                  {/* Team Members */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">
                      Team Members
                    </h4>
                    <div className="space-y-3">
                      {teamData.teamMembers.map((member, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-1 md:grid-cols-2 gap-3"
                        >
                          <div className="space-y-1.5">
                            <label
                              htmlFor={`member-name-${index}`}
                              className="block text-xs font-medium text-foreground"
                            >
                              Member {index + 1} Name
                            </label>
                            <input
                              type="text"
                              id={`member-name-${index}`}
                              placeholder="Full name"
                              value={member.name}
                              onChange={(e) =>
                                handleTeamMemberChange(
                                  index,
                                  "name",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 h-10 py-2 bg-card rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border"
                              disabled={isSubmitting}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label
                              htmlFor={`member-email-${index}`}
                              className="block text-xs font-medium text-foreground"
                            >
                              Member {index + 1} Email
                            </label>
                            <input
                              type="email"
                              id={`member-email-${index}`}
                              placeholder="email@example.com"
                              value={member.email}
                              onChange={(e) =>
                                handleTeamMemberChange(
                                  index,
                                  "email",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 h-10 py-2 bg-card rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border"
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="space-y-5 pt-4 border-t border-border">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-medium text-foreground">Target Audience (ICP)</h3>
              <p className="text-sm text-muted-foreground">
                Help us match your app with the right users by defining your Ideal Customer Profile.
              </p>
            </div>

            {/* Project Stage */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Project Stage <span className="text-destructive">*</span>
              </label>
              <Select
                value={formData.stage}
                onValueChange={(v) => setFormData(prev => ({ ...prev, stage: v as "idea" | "building" | "beta" | "live" }))}
              >
                <SelectTrigger className="w-full h-10 px-3 text-sm border border-border bg-white rounded-md focus:ring-1 focus:ring-foreground">
                  <SelectValue placeholder="Select your project stage..." />
                </SelectTrigger>
                <SelectContent className="border shadow-md">
                  <SelectItem value="idea" className="text-sm py-2">💡 Idea (Pre-build / Validation)</SelectItem>
                  <SelectItem value="building" className="text-sm py-2">🏗️ Just Building (Ideation / Dev)</SelectItem>
                  <SelectItem value="beta" className="text-sm py-2">🧪 Beta (Waitlist / Early Access)</SelectItem>
                  <SelectItem value="live" className="text-sm py-2">🚀 Live (Publicly Available)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Category & Subcategories — cascading selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Product Category <span className="text-destructive">*</span>
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">(Select a category, then subcategories)</span>
              </label>

              {/* Category dropdown */}
              <Select
                value={selectedIcpCategory}
                onValueChange={(v) => {
                  setSelectedIcpCategory(v);
                  setSelectedSubcategories([]);
                }}
              >
                <SelectTrigger className="w-full h-10 px-3 text-sm border border-border bg-white rounded-md focus:ring-1 focus:ring-foreground">
                  <SelectValue placeholder={icpOptions === undefined ? "Loading categories..." : "Select a product category..."} />
                </SelectTrigger>
                <SelectContent className="border shadow-md max-h-60 overflow-y-auto">
                  {(icpOptions?.roleCategories ?? []).map(c => (
                    <SelectItem key={c} value={c} className="text-sm py-2">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Subcategory multi-select */}
              {selectedIcpCategory && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-muted-foreground">Subcategories</label>
                  <MultiSelect
                    options={icpOptions?.roleSubcategories[selectedIcpCategory] ?? []}
                    selected={selectedSubcategories}
                    onChange={setSelectedSubcategories}
                    placeholder="Select subcategories..."
                  />
                  {selectedSubcategories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newRoles = [...formData.icpRoles, ...selectedSubcategories];
                        setFormData(prev => ({ ...prev, icpRoles: [...new Set(newRoles)] }));
                        setSelectedSubcategories([]);
                      }}
                      className="mt-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Add {selectedSubcategories.length} subcategory{selectedSubcategories.length === 1 ? "" : "s"}
                    </button>
                  )}
                </div>
              )}

              {/* Selected subcategories chips */}
              {formData.icpRoles.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.icpRoles.map(role => (
                    <span key={role} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-secondary text-secondary-foreground border border-border">
                      {role}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icpRoles: prev.icpRoles.filter(r => r !== role) }))}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {formData.icpRoles.length === 0 && icpOptions !== undefined && (
                <p className="text-xs text-destructive">Please select at least one subcategory.</p>
              )}
            </div>

            {/* Primary Pain Point */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Primary Pain Point Solved <span className="text-destructive">*</span>
              </label>
              <Select
                value={formData.icpProblem}
                onValueChange={(v) => setFormData(prev => ({ ...prev, icpProblem: v }))}
              >
                <SelectTrigger className="w-full h-10 px-3 text-sm border border-border bg-white rounded-md focus:ring-1 focus:ring-foreground">
                  <SelectValue placeholder={icpOptions === undefined ? "Loading challenges..." : "Select a challenge your product solves..."} />
                </SelectTrigger>
                <SelectContent className="border shadow-md">
                  {(icpOptions?.challenges ?? []).map(c => (
                    <SelectItem key={c} value={c} className="text-sm py-2">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Spending Tier (formerly Target Budget Bracket) */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Spending Tier <span className="text-destructive">*</span>
              </label>
              <Select
                value={formData.icpBudget}
                onValueChange={(v) => setFormData(prev => ({ ...prev, icpBudget: v }))}
              >
                <SelectTrigger className="w-full h-10 px-3 text-sm border border-border bg-white rounded-md focus:ring-1 focus:ring-foreground">
                  <SelectValue placeholder={icpOptions === undefined ? "Loading spending tiers..." : "Select typical subscription budget..."} />
                </SelectTrigger>
                <SelectContent className="border shadow-md">
                  {(icpOptions?.budgets ?? []).map(b => (
                    <SelectItem key={b} value={b} className="text-sm py-2">{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Anti-Persona — optional */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Who this is NOT for
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Enterprise users, non-technical users..."
                value={formData.notFor}
                onChange={(e) => setFormData(prev => ({ ...prev, notFor: e.target.value }))}
                className="w-full px-3 py-2 h-10 bg-white rounded-md text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground border border-border"
              />
            </div>
          </div>

          {/* AI SEO FAQ Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-medium text-foreground">Enhanced SEO: FAQs</h3>
                <p className="text-sm text-muted-foreground italic">
                  Boost visibility for AI search (ChatGPT, Perplexity, SGE). If left blank, we'll auto-generate them for you!
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddFaq}
                className="px-3 py-1.5 bg-muted text-foreground rounded-md text-sm font-medium hover:bg-muted-foreground/10 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </div>

            {faqs.length > 0 && (
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border relative group">
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-destructive/90 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-foreground">
                          Question {index + 1}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. How does Shipgrid improve SEO?"
                          value={faq.question}
                          onChange={(e) => handleFaqChange(index, "question", e.target.value)}
                          className="w-full px-3 h-10 py-2 bg-card rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-foreground">
                          Answer {index + 1}
                        </label>
                        <textarea
                          placeholder="Provide a clear, concise answer for AI bots to index."
                          value={faq.answer}
                          onChange={(e) => handleFaqChange(index, "answer", e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-card rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Select Tags *
            </label>
            <p className="text-xs text-muted-foreground">
              Select tags that best describe your app or hackathon participation?
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {availableTags === undefined && (
                <span className="text-sm text-muted-foreground">Loading tags...</span>
              )}
              {availableTags
                ?.filter(
                  (tag: Tag) =>
                    tag.name !== "resendhackathon" &&
                    tag.name !== "ychackathon",
                )
                .map((tag: Tag) => (
                  <button
                    key={tag._id}
                    type="button"
                    onClick={() => toggleTag(tag._id)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors border flex items-center gap-1 ${selectedTagIds.includes(tag._id) ? "bg-muted text-foreground border-border" : "bg-card text-muted-foreground border-border hover:border-muted-foreground/30 hover:text-foreground"}`}
                    style={{
                      backgroundColor: selectedTagIds.includes(tag._id)
                        ? (tag.backgroundColor || "hsl(var(--muted))")
                        : "hsl(var(--card))",
                      color: selectedTagIds.includes(tag._id)
                        ? (tag.textColor || "hsl(var(--foreground))")
                        : "hsl(var(--muted-foreground))",
                      borderColor: selectedTagIds.includes(tag._id)
                        ? (tag.borderColor || (tag.backgroundColor ? "transparent" : "hsl(var(--border))"))
                        : "hsl(var(--border))",
                    }}
                  >
                    {tag.emoji && <span className="text-sm">{tag.emoji}</span>}
                    {tag.iconUrl && !tag.emoji && (
                      <img
                        src={tag.iconUrl}
                        alt=""
                        className="w-4 h-4 rounded-sm object-cover"
                      />
                    )}
                    {tag.name}
                  </button>
                ))}
            </div>
            {/* Dropdown Search for All Tags */}
            <div className="space-y-1.5 mb-6">
              <label className="block text-sm font-medium text-foreground">
                Search All Available Tags
              </label>
              <p className="text-xs text-muted-foreground">
                Find and select from all tags, including those not shown above
              </p>
              <div className="relative tag-dropdown-container">
                <input
                  type="text"
                  value={dropdownSearchValue}
                  onChange={(e) => {
                    setDropdownSearchValue(e.target.value);
                    setShowDropdown(e.target.value.length > 0);
                  }}
                  onFocus={() =>
                    setShowDropdown(dropdownSearchValue.length > 0)
                  }
                  placeholder="Type to search for tags..."
                  className="w-full px-3 h-10 py-2 bg-card rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border"
                  disabled={isSubmitting}
                />

                {/* Dropdown Results */}
                {showDropdown && allTags && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {(() => {
                      const searchTerm = dropdownSearchValue.toLowerCase();
                      const filteredTags = allTags
                        .filter(
                          (tag: any) =>
                            tag.name.toLowerCase().includes(searchTerm) &&
                            !selectedTagIds.includes(tag._id) &&
                            !newTagNames.some(
                              (newTag) =>
                                newTag.toLowerCase() === tag.name.toLowerCase(),
                            ),
                        )
                        .slice(0, 10); // Limit to 10 results for performance

                      if (filteredTags.length === 0) {
                        return (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No matching tags found
                          </div>
                        );
                      }

                      return filteredTags.map((tag: any) => (
                        <button
                          key={tag._id}
                          type="button"
                          onClick={() => handleSelectFromDropdown(tag._id)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none flex items-center gap-2"
                          disabled={isSubmitting}
                        >
                          {tag.emoji && (
                            <span className="text-sm">{tag.emoji}</span>
                          )}
                          {tag.iconUrl && !tag.emoji && (
                            <img
                              src={tag.iconUrl}
                              alt=""
                              className="w-4 h-4 rounded-sm object-cover"
                            />
                          )}
                          <span
                            className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: tag.backgroundColor || "hsl(var(--muted))",
                              color: tag.textColor || "hsl(var(--foreground))",
                              border: `1px solid ${tag.backgroundColor ? "transparent" : "hsl(var(--border))"}`,
                            }}
                          >
                            {tag.name}
                          </span>
                          {tag.isHidden && (
                            <span className="text-xs text-muted-foreground/60">
                              (Hidden)
                            </span>
                          )}
                        </button>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
            {/* Selected Tags Display */}
            {(selectedTagIds.length > 0 || newTagNames.length > 0) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Selected Tags ({selectedTagIds.length + newTagNames.length}
                  /10)
                </label>
                <div className="flex flex-wrap gap-2">
                  {/* Show selected existing tags */}
                  {allTags &&
                    selectedTagIds.map((tagId) => {
                      const tag = allTags.find((t: any) => t._id === tagId);
                      if (!tag) return null;

                      return (
                        <span
                          key={tag._id}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm border transition-colors"
                          style={{
                            backgroundColor: tag.backgroundColor || "hsl(var(--muted))",
                            color: tag.textColor || "hsl(var(--foreground))",
                            borderColor: tag.backgroundColor
                              ? "transparent"
                              : "hsl(var(--border))",
                          }}
                        >
                          {tag.emoji && (
                            <span className="text-sm">{tag.emoji}</span>
                          )}
                          {tag.iconUrl && !tag.emoji && (
                            <img
                              src={tag.iconUrl}
                              alt=""
                              className="w-4 h-4 rounded-sm object-cover"
                            />
                          )}
                          {tag.name}
                          {tag.isHidden && (
                            <span className="text-xs opacity-70">(Hidden)</span>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleTag(tag._id)}
                            disabled={isSubmitting}
                            className="ml-1 text-current hover:opacity-70 transition-opacity"
                            title="Remove tag"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}

                  {/* Show new tags being created */}
                  {newTagNames.map((tagName) => (
                    <span
                      key={tagName}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-md text-sm border border-primary/20"
                    >
                      {tagName}
                      <span className="text-xs opacity-70">(New)</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewTag(tagName)}
                        disabled={isSubmitting}
                        className="ml-1 text-primary hover:text-primary/70 transition-colors"
                        title="Remove tag"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5 mb-2">
              <label className="block text-sm font-medium text-foreground">
                Add New Tags (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagInputValue}
                  onChange={(e) => setNewTagInputValue(e.target.value)}
                  placeholder={
                    selectedTagIds.length + newTagNames.length >= 10
                      ? "Maximum 10 tags reached"
                      : "Enter new tag name..."
                  }
                  className="flex-1 px-3 h-10 py-2 bg-card rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border"
                  disabled={
                    isSubmitting ||
                    selectedTagIds.length + newTagNames.length >= 10
                  }
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
                disabled={
                  !newTagInputValue.trim() ||
                  isSubmitting ||
                  selectedTagIds.length + newTagNames.length >= 10
                }
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
            {selectedTagIds.length + newTagNames.length >= 10 && (
              <p className="text-xs text-primary mt-1">
                Maximum of 10 tags reached. Remove a tag to add another.
              </p>
            )}
            </div>
          </div>
          {/* Open Source Toggle */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isOpenSource"
              checked={formData.isOpenSource}
              onChange={(e) => setFormData(prev => ({ ...prev, isOpenSource: e.target.checked }))}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="isOpenSource" className="text-sm text-foreground cursor-pointer select-none">
              This is an open source project
            </label>
          </div>

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
                formData.icpRoles.length === 0 ||
                !formData.icpProblem ||
                !formData.icpBudget
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
              To maintain quality and prevent spam, you can submit up to{" "}
              {settings.submissionLimitCount || 10} projects per day.
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
      </div>

      {/* Auth Required Dialog */}
      <AuthRequiredDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        action="submit your app"
        title="Sign in to submit"
        description="You need to be signed in to submit apps to the community. Join to share your projects!"
      />

      {/* Image Modal */}
      {imageModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div
            className="relative max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
              aria-label="Close image viewer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Buttons */}
            {imageModalImages.length > 1 && (
              <>
                <button
                  onClick={() => navigateImageModal("prev")}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => navigateImageModal("next")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Main Image in Modal */}
            <img
              src={imageModalImages[imageModalCurrentIndex]}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            {/* Image Counter */}
            {imageModalImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {imageModalCurrentIndex + 1} / {imageModalImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



